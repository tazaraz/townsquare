import { defineStore } from 'pinia';
import type { ReceiveMessage, SendMessage } from '~~/server/routes/townsquare/[id]/live';


let pongTimeout: NodeJS.Timeout;
let timedOut = false;


export const useSocket = defineStore('socket', () => {
    const gamestate = useGamestate();
    const players = usePlayers();
    const game = useGame();
    const toaster = useToaster();

    /** Seat index of the current player */
    const seatIndex = computed(() => gamestate.seatIndex);
    /** Whether this player is the host */
    const isHost = computed(() => gamestate.isHost);
    /** Public ID of the player */
    const id = computed(() => gamestate.id);

    let unobserveState = () => {}
    let ws: WebSocket | undefined = undefined;

    /**
     * Creates a townsquare for others to join
     * @param townsquare Townsquare ID
     * @param password Password for this townsquare
     * @returns string on error
     */
    async function create(townsquare: string, password: string) {
        const res = await fetch(`/townsquare/${townsquare}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })

        if (res.status >= 300)
            return { status: res.status, text: res.statusText}

        gamestate.reset('connection')
        return createWS(townsquare)
    }

    /**
     * Joins an existing townsquare
     * @param townsquare Townsquare ID
     * @param password Password for this townsquare
     * @returns string on error
     */
    async function connect(townsquare: string, password: string) {
        const res = await fetch(`/townsquare/${townsquare}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })

        if (res.status >= 300)
            return { status: res.status, text: res.statusText}

        gamestate.reset('connection')
        return createWS(townsquare)
    }

    /** Reonnects to the server using cookies */
    async function reconnect() {
        const townsquare = getUrlSessionId()
        if (townsquare) {
            const res = await fetch(`/townsquare/${townsquare}/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            if (res.status >= 300) {
                toaster.serverError(res.statusText)
                disconnect()

                return { status: res.status, text: res.statusText}
            }

            // Create a copy of the seatindex
            const seatIndex = Number(gamestate.seatIndex)
            gamestate.seatIndex = -1

            await createWS(townsquare)
            if (!gamestate.isHost) {
                // Resync
                sendTo('host', 'sync', true)

                // Request seat again, but we reset preemtively if that fails to not lock up state
                requestClaim(seatIndex)
            }

            return true;
        }

        return { status: 404, text: 'No townsquare to reconnect to' }
    }

    /** Disconnects and cleans up most data. */
    function disconnect() {
        navigateTo(`/`)
        ws?.close()

        // Show hosting tools again
        gamestate.reset('connection')
        gamestate.isHost = true

        for (const player of players.list) {
            player.socketId = undefined
        }
    }

    /**
     * Connects to a townsquare session.
     * @param townsquare The townsquare connecting to
     */
    function createWS(townsquare: string) {
        navigateTo(`/townsquare/${townsquare}`)

        // Set some stuff
        gamestate.isHost = false;
        unobserveState()

        ws = new WebSocket(`/townsquare/${townsquare}/live`)
        ws.onmessage = handleMessage
        ws.onclose = (e) => {
            unobserveState()
            ws = undefined;

            if (e.code == 1006)
                toaster.serverError('The connection was abruptly stopped. Please reload the page.')
            // Firefox does onclose with code 1001 on reload, but we dont want to destroy the session on reload,
            // so serverside uses 1012 for close instead of 1001.
            if (e.code > 1001)
                disconnect();
        }

        // Create an awaitable promise that resolves when the socket is connected
        return new Promise<void>((resolve) => {
            // If we reconnect, this is still in localStorage. Unset.
            if (id.value !== '')
                gamestate.id = ''

            const stop = watch(() => gamestate.id, (id) => {
                if (id) {
                    resolve()
                    stop()
                }
            })
        })
    }

    /** Allows the host to shut down the current session, and disconnect all players */
    function closeTownsquare() {
        if (!ws) return

        sendTo('server', 'close', true)
        disconnect()
    }

    /** Send a direct message */
    const sendTo = (to: SendMessage['to'], kind: SendMessage['kind'], data: any) => _send({ to, kind, data})
    /** Send a global message. Can only be used by the `host` */
    const broadcast = (kind: SendMessage['kind'], data: any) => _send({ broadcast: true, kind, data })

    /**
     * Send a message. If the host will send a reply, it is awaitable. Has a timeout of 5 seconds
     * @param message: Message to send
     */
    async function _send({ broadcast, to, kind, data }: SendMessage) {
        if (!ws)
            await reconnect()
        if (!ws){
            if (!getUrlSessionId())
                return
            return toaster.connectionError()
        }

        // if (target === 'direct' && !to) return 'Invalid message'
        const message: SendMessage = { to, kind, data };
        if (broadcast)
            message.broadcast = true

        // Send data
        ws.send(JSON.stringify(message))
    }

    const requestNominate = (index: number) => sendTo('host', 'nominate', { index } )
    const requestRename   = (name: string) => sendTo('host', 'rename', { name } )
    const requestClaim    = (index: number) => sendTo('host', 'claim', { index } )
    const requestUnclaim  = () => sendTo('host', 'unclaim', undefined )
    const requestVote   = () => sendTo('host', 'vote', undefined )

    function syncDataToPlayers() {
        for (const [index, player] of players.list.entries()) {
            if (!player.socketId) continue

            // Send the character to the player
            sendTo(player.socketId, 'role', { index, role: player.role?.id })

            // If it is the demon, sync the bluffs as well
            if (player.role?.team === 'demon')
                sendTo(player.socketId, 'bluffs', gamestate.demonBluffs.map(b => b?.id))
        }
    }

    /** Handles messages received from the server */
    function handleMessage(event: MessageEvent) {
        const message: ReceiveMessage = JSON.parse(event.data);

        switch (message.kind) {
            case 'notification':
                return toaster.serverNotification(message.data)
            case 'error':
                return toaster.serverError(message.data)
            case 'ping':
            case 'pong':
                clearTimeout(pongTimeout)
                pongTimeout = setTimeout(() => {
                    // We have timed out, but verify it is true.
                    timedOut = true;
                    sendTo('server', 'ping', true)

                    // If we are still timed out
                    setTimeout(() => {
                        if (id.value || !getUrlSessionId()) return
                        if (timedOut)
                            toaster.connectionError()
                    }, 500)
                }, 45000)

                return sendTo('server', 'pong', true)

            case 'connected':
                gamestate.isHost = message.data.isHost
                if (gamestate.isHost)
                    unobserveState = observeState()

                gamestate.id = document.cookie.match(/id=([^;]+)/)?.[1]!
                gamestate.sessionId = getUrlSessionId()!

                if (!gamestate.id || !gamestate.sessionId)
                    return toaster.serverError('Could not find your session. Please reload the page.')

                if (!gamestate.isHost)
                    return sendTo('host', 'sync', true)

                // We are the host, so we need to sync the data to the players on connect.
                // Trigger a request for sync on the players
                return broadcast('connected', true)

            // Sync state to the player
            case 'sync':
                // Send data to the joined player as host
                if (gamestate.isHost) {
                    sendTo(message.origin, 'sync', {
                        script: gamestate.script,
                        fabled: gamestate.fabled.map(r => r.id),
                        loric: gamestate.loric.map(r => r.id),
                        demonBluffs: gamestate.players.find(p => p.role?.team === 'demon')?.socketId === message.origin
                            ? gamestate.demonBluffs.map(b => b?.id)
                            : [undefined, undefined, undefined],
                        players: players.list.map(p => ({
                            name: p.name,
                            state: p.state,
                            socketId: p.socketId,
                            nominated: p.nominated,
                        })),
                        nomination: gamestate.nomination,
                    })
                }

                // Receive data from the host
                else {
                    // If no script is set, ignore
                    if (message.data.script) {
                        game.loadScript(message.data.script.roles)
                        message.data.demonBluffs.forEach((id: string | undefined, i: number) => game.setBluff(i, id));
                    }

                    // If there is a mismatch in the player data, reset it
                    if (JSON.stringify(message.data.players.map((p: any) => ({
                            name: p.name, state: p.state, socketId: p.socketId
                        })))
                        !== JSON.stringify(players.list.map((p: any) => ({
                            name: p.name, state: p.state, socketId: p.socketId
                        })))
                    ) {
                        // Reset the seats, and re-add all players
                        gamestate.reset('seats')

                        // Update the state
                        message.data.players.forEach((
                            { name, state, socketId, nominated }: {
                                name: string
                                state: PlayerState
                                socketId: string
                                nominated: { been: boolean, has: boolean }
                            }) => {
                                players.add(name)
                                players.setState(players.length - 1, state)
                                players.claim(players.length - 1, socketId)
                                players.get(players.length - 1)!.nominated = nominated
                            }
                        );

                        // Check if the received seat socketId is still identical to ours
                        if (players.get(gamestate.seatIndex)?.socketId !== id.value)
                            gamestate.seatIndex = -1
                    }

                    // Set the nomination state
                    gamestate.nomination = message.data.nomination
                }

                return
            case 'leave':
                // Get the player with this id
                const seat = players.list.find(p => p.socketId == message.data.id)
                if (!seat) return

                seat.socketId = undefined
                if (gamestate.isHost)
                    broadcast('leave', { id: message.data.id })

                toaster.leftGame(seat.name)
                return
            case 'message':
                const player = players.list.find(p => p.socketId === message.origin)
                // If the receiver is host but the player does not exist
                if (isHost.value && !player)
                    return
                // If receiver is host or another player
                else if ((isHost.value && player) || (!isHost.value && player))
                    message.data.title = `${player.name} says to you:`
                // If origin is host and receiver is player
                else if (!isHost.value && !player)
                    message.data.title = `A raven whispers to you:`
                toaster.showDirectMessage(message.data, isHost.value ? message.origin : 'host')
                return
            case 'claim':
                if (gamestate.isHost) {
                    // Check if it is possible to claim this seat, and if the user is not claiming two seats
                    if (!players.get(message.data.index) ||
                        players.get(message.data.index)!.socketId !== undefined ||
                        players.list.some(p => p.socketId === message.origin)) {
                        return
                    }

                    broadcast('claim', { index: message.data.index, id: message.origin })
                    message.data.id = message.origin
                }

                return players.claim(message.data.index, message.data.id)
            case 'unclaim':
                if (gamestate.isHost) {
                    const index = players.list.findIndex(p => p.socketId === message.origin)
                    if (index < 0) return

                    message.data = { index }
                    broadcast('vote', { index, voting: false })
                    broadcast('unclaim', message.data)
                }

                players.vote(message.data.index, false)
                return players.unclaim(message.data.index)
            case 'rename':
                // No namechanges during nomination
                if (gamestate.nomination.open)
                    return

                if (gamestate.isHost) {
                    const index = players.list.findIndex(p => p.socketId === message.origin)
                    if (index < 0) return

                    message.data.name = message.data.name.trim().substring(0, 10)
                    message.data.index = index
                    broadcast('rename', message.data)
                }

                return players.setName(message.data.index, message.data.name)
            case 'nominate':
                if (gamestate.isHost) {
                    if (!gamestate.nomination.open || gamestate.nomination.nominee > 0)
                        return

                    const nominator = players.list.findIndex(p => p.socketId === message.origin)
                    if (nominator < 0) return

                    toaster.nominationRequest(nominator, message.data.index)
                }
                return
            case 'vote':
                if (gamestate.isHost) {
                    const index = players.list.findIndex(p => p.socketId === message.origin)
                    if (index < 0) return

                    if (players.voteLocked(index))
                        return

                    message.data = { index, voting: !players.list[index]!.isVoting }
                    broadcast('vote', message.data)
                }

                // Toggle the voting state of the player
                players.list[message.data.index]!.isVoting = message.data.voting
                return

            /** The following code should only be received by players, and the host should ignore them */
            case 'swap':
                if (gamestate.isHost) return
                return players.swap(message.data.index1, message.data.index2)
            case 'kick':
                if (gamestate.isHost) return
                players.kick(message.data.index)
                if (!isHost.value && gamestate.seatIndex === message.data.index) {
                    disconnect()
                    toaster.serverError('You have been kicked from the session.')
                }
                return
            case 'role':
                if (gamestate.isHost) return
                return players.setRole(message.data.index, message.data.role)
            case 'player':
                if (gamestate.isHost) return
                if (message.data.add) {
                    return players.add(message.data.add)
                } else {
                    players.remove(message.data.remove)

                    if (gamestate.seatIndex === message.data.remove)
                        gamestate.seatIndex = -1

                    return
                }
            case 'state':
                if (gamestate.isHost) return
                return players.setState(message.data.index, message.data.state)
            case 'bluffs':
                if (gamestate.isHost) return
                return (message.data as (string | undefined)[]).forEach((bluff, i) => game.setBluff(i, bluff));
            case 'script':
                if (gamestate.isHost) return
                return game.loadScript(message.data)
            case 'modifier':
                if (gamestate.isHost) return
                toaster.modifier(message.data.type)
                return game.toggleModifier(message.data.type, message.data.role)
            case 'grimoire':
                if (gamestate.isHost) return
                return useUI().showTemporaryGrimoire(message.data)
            case 'nomination':
                if (gamestate.isHost) return
                game.nomination.open       = message.data.open ?? game.nomination.open
                game.nomination.speed      = message.data.speed ?? game.nomination.speed
                game.nomination.hand       = message.data.hand ?? game.nomination.hand
                game.nomination.marked     = message.data.marked !== undefined
                                                ? message.data.marked
                                                : game.nomination.marked
                if (message.data.nominator !== undefined && message.data.nominee !== undefined)
                    players.setNominated(message.data.nominee, message.data.nominator, message.data.state ?? false)
                return
            case 'history':
                if (gamestate.isHost) return
                game.nomination.history.entries.length = 0
                message.data.forEach((entry: NominationHistoryEntry) => game.nomination.history.entries.push(entry))
                return
        }
    }

    function observeState() {
        const unactPlayers = players.$onAction(({ name, args, after }) => after((success) => {
            if (success === false) return
            switch (name) {
                case 'add':
                    return broadcast('player', { add: args[0] })
                case 'remove':
                    return broadcast('player', { remove: args[0] })
                case 'kick':
                    return broadcast('kick', { index: args[0] })
                case 'swap':
                    return broadcast('swap', { index1: args[0], index2: args[1] })
                case 'setName':
                    return broadcast('rename', { index: args[0], name: args[1] })
                case 'setState':
                    return broadcast('state', { index: args[0], state: args[1] })
                case 'setNominated':
                    return broadcast('nomination', { nominee: args[0], nominator: args[1], state: args[2] })

            }
        }))

        const unactGame = game.$onAction(({ name, args, after }) => after((success) => {
            if (success === false) return
            switch (name) {
                case 'loadScript':
                    return broadcast('script', args[0])
                case 'toggleModifier':
                    return broadcast('modifier', { type: args[0], role: args[1] })
                case 'setNominations':
                    return broadcast('nomination', {
                        open: gamestate.nomination.open,
                        marked: gamestate.nomination.marked,
                        nominator: gamestate.nomination.nominator,
                        nominee: gamestate.nomination.nominee,
                        hand: gamestate.nomination.hand,
                     })
                case 'setMarked':
                    if (gamestate.nomination.history.sync)
                        broadcast('history', game.nomination.history.entries)

                    return broadcast('nomination', {
                        marked: game.nomination.marked,
                        nominator: game.nomination.nominator,
                        nominee: game.nomination.nominee,
                    })
            }
        }))

        return () => {
            unactPlayers();
            unactGame();
        }
    }

    function getUrlSessionId() {
        return window.location.href.match(/\/townsquare\/([^\/]+)/)?.[1]
    }

    return {
        seatIndex,
        isHost,
        id,

        create,
        connect,
        disconnect,
        reconnect,
        closeTownsquare,

        syncDataToPlayers,

        requestNominate,
        requestVote,
        requestRename,
        requestClaim,
        requestUnclaim,

        sendTo,
        broadcast,

        getUrlSessionId,
    }
})