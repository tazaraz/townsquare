import { defineStore } from 'pinia';
import type { ReceiveMessage, SendMessage } from '~~/server/routes/townsquare/[id]/live';


export const useSocket = defineStore('socket', () => {
    const gamestate = useGamestate();
    const players = usePlayers();
    const game = useGame();

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

        return createWS(townsquare)
    }

    function disconnect() {
        ws?.close()
        ws = undefined;
        gamestate.reset('connection')
        gamestate.isHost = true

        for (const player of players.list) {
            player.socketId = undefined
        }
    }

    function reconnect() {
        console.log('reconnect')
        const townsquare = window.location.href.match(/\/townsquare\/([^\/]+)/)?.[1]
        if (townsquare)
            createWS(townsquare)
    }

    function createWS(townsquare: string) {
        gamestate.id = document.cookie.match(/id=([^;]+)/)?.[1]!
        window.history.pushState({}, '', `/townsquare/${townsquare}`)

        // Set some stuff
        gamestate.reset('connection')
        gamestate.isHost = false;
        unobserveState()

        ws = new WebSocket(`/townsquare/${townsquare}/live`)
        ws.onmessage = handleMessage
        ws.onclose = () => {
            // Show hosting tools again
            gamestate.isHost = true
            disconnect()
            unobserveState()
        }
    }

    /** Send a direct message */
    const sendTo = (to: SendMessage['to'], kind: SendMessage['kind'], data: any) => _send({ to, kind, data})
    /** Send a global message. Used only by the `host` */
    const broadcast = (kind: SendMessage['kind'], data: any) => _send({ broadcast: true, kind, data })

    /**
     * Send a message. If the host will send a reply, it is awaitable. Has a timeout of 5 seconds
     * @param message: Message to send
     */
    async function _send({ broadcast, to, kind, data }: SendMessage) {
        if (!ws)
            reconnect()

        // if (target === 'direct' && !to) return 'Invalid message'
        const message: SendMessage = { to, kind, data };
        if (broadcast)
            message.broadcast = true

        // Send data
        ws.send(JSON.stringify(message))
    }

    const requestNominate = (index: number) => sendTo('host', 'nominate', { index } )
    const requestRename   = (name: string) => sendTo('host', 'rename', { name, index: gamestate.seatIndex } )
    const requestClaim    = (index: number) => sendTo('host', 'claim', { index } )
    const requestUnclaim  = () => sendTo('host', 'unclaim', { index: gamestate.seatIndex } )
    const requestVoting   = () => sendTo('host', 'voting', { index: gamestate.seatIndex } )

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

    function handleMessage(event: MessageEvent) {
        const message: ReceiveMessage = JSON.parse(event.data);

        switch (message.kind) {
            case 'ping':
                return sendTo('server', 'pong', true)
            case 'host':
                gamestate.isHost = message.data
                if (gamestate.isHost)
                    unobserveState = observeState()
                return
            case 'leave':
                // Get the player with this id
                const seat = players.list.find(p => p.socketId == message.data.id)
                if (!seat) return

                if (gamestate.isHost)
                    broadcast('leave', message.data)

                seat.socketId = undefined
                return
            case 'claim':
                if (gamestate.isHost) {
                    // Check if it is possible to claim this seat, and if the user is not claiming two seats
                    if (!players.list[message.data.index] ||
                        players.list[message.data.index]!.socketId !== undefined ||
                        players.list.some(p => p.socketId === message.origin)) {
                        return
                    }

                    broadcast('claim', { index: message.data.index, id: message.origin})
                }

                return players.claim(message.data.index, message.origin)
            case 'unclaim':
                if (gamestate.isHost) {
                    // Verify that this player can unclaim
                    if (players.list[message.data.index]?.socketId !== message.origin)
                        return

                    broadcast('unclaim', message.data)
                }

                return players.unclaim(message.data.index)
            case 'rename':
                if (gamestate.isHost) {
                    // Verify that this player is renaming itself
                    if (players.list[message.data.index]?.socketId !== message.origin)
                        return

                    broadcast('rename', message.data)
                }

                return players.setName(message.data.index, message.data.name)

            /** The following code should only be received by players, and the host should ignore them */
            case 'swap':
                if (gamestate.isHost) return
                return players.swap(message.data.index1, message.data.index2)
            case 'role':
                if (gamestate.isHost) return
                return console.log(players.setRole(message.data.index, message.data.role))
            case 'player':
                if (gamestate.isHost) return
                if (message.data.add)
                    return players.add(message.data.add)
                else
                    return players.remove(message.data.remove)
            case 'state':
                if (gamestate.isHost) return
                return players.setState(message.data.index, message.data.state)
            case 'bluffs':
                if (gamestate.isHost) return
                return (message.data as (string | undefined)[]).forEach((bluff, i) => game.setBluff(i, bluff));
            case 'script':
                if (gamestate.isHost) return
                return game.loadScript(message.data)
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
                case 'swap':
                    return broadcast('swap', { index1: args[0], index2: args[1] })
                case 'setName':
                    return broadcast('rename', { index: args[0], name: args[1] })
                case 'setState':
                    return broadcast('state', { index: args[0], state: args[1] })
            }
        }))

        const unactGame = game.$onAction(({ name, args, after }) => after((success) => {
            if (success === false) return
            switch (name) {
                case 'loadScript':
                    return broadcast('script', args[0])
                case 'toggleFabled':
                    return broadcast('modifier', { type: 'fabled', role: args[0] })
                case 'toggleLoric':
                    return broadcast('modifier', { type: 'loric', role: args[0] })
            }
        }))

        return () => {
            unactPlayers();
            unactGame();
        }
    }

    return {
        seatIndex,
        isHost,
        id,

        create,
        connect,
        disconnect,

        syncDataToPlayers,

        requestNominate,
        requestVoting,
        requestRename,
        requestClaim,
        requestUnclaim,
    }
})