import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type Pinia, createPinia, setActivePinia } from 'pinia'
import WebSocket from 'ws'

/** Amount of players we reserve */
const PLAYERS = 4
/* We explain to vitest what the host should be */
const HOST = 'localhost:3000'
/** Time the host should wait for all changes to process */
const DELAY = 200


const cookies = new Map<Pinia, string>()
let activeSession: Pinia

const originalFetch = globalThis.fetch
const OriginalWebSocket = WebSocket

/** Overwrite fetch to understand the HOST and parse cookies */
globalThis.fetch = async (input, init) => {
    if (typeof input === 'string' && input.startsWith('/')) {
        input = `http://${HOST}${input}`
    }

    const headers = new Headers(init?.headers)

    const cookie = cookies.get(activeSession)
    if (cookie) {
        headers.set('Cookie', cookie)
    }

    const response = await originalFetch(input, {
        ...init,
        headers,
    })

    const setCookies = response.headers.getSetCookie()

    if (setCookies.length) {
        cookies.set(
            activeSession,
            setCookies
                .map(cookie => cookie.split(';')[0])
                .join('; '),
        );
        for (const cookie of cookies.get(activeSession)!.split('; '))
            document.cookie = cookie

        document.cookie = cookies.get(activeSession) ?? ''
    }

    return response
}

/** Overwrite WebSocket to understand the HOST and parse cookies */
class TestWebSocket extends OriginalWebSocket {
    constructor(path: string | URL, options?: WebSocket.ClientOptions) {
        const resolved = new URL(
            path.toString(),
            `ws://${HOST}/`,
        )

        const cookie = cookies.get(activeSession)

        super(resolved.toString(), {
            ...options,
            headers: cookie
                ? { Cookie: cookie }
                : undefined,
        })
    }
}

globalThis.WebSocket = TestWebSocket as any


function activatePinia(pinia: Pinia) {
    setActivePinia(pinia)
    activeSession = pinia
    for (const cookie of (cookies.get(activeSession) ?? '').split('; '))
        document.cookie = cookie
}


function itemsFrom(start: number, count: number) {
    return Array(Math.floor(count)).fill(0).map((_, i) => Math.floor(start) + i).values()
}


describe('Socket Store', () => {
    let host: Pinia
    let players: Pinia[] = []

    let hstate: ReturnType<typeof useGamestate>
    let hgame: ReturnType<typeof useGame>
    let hplayers: ReturnType<typeof usePlayers>
    let hsocket: ReturnType<typeof useSocket>

    let pstate: ReturnType<typeof useGamestate>[] = []
    let pgame: ReturnType<typeof useGame>[] = []
    let pplayers: ReturnType<typeof usePlayers>[] = []
    let psocket: ReturnType<typeof useSocket>[] = []

    beforeEach(async () => {
        host = createPinia()
        activatePinia(host)

        hstate = useGamestate()
        hgame = useGame()
        hplayers = usePlayers()
        hsocket = useSocket()

        for (const p of Array(PLAYERS).keys()) {
            players.push(createPinia())
            activatePinia(players[p]!)

            pstate.push(useGamestate())
            pgame.push(useGame())
            pplayers.push(usePlayers())
            psocket.push(useSocket())
        }

        activatePinia(host)
        const session = await hsocket.create('1', '1')
        if (session)
            expect.fail(session.text)
    })

    afterEach(() => {
        hsocket.closeTownsquare();
    })

    it('connects and disconnects', async () => {
        for (const p of itemsFrom(0, PLAYERS)) {
            activatePinia(players[p]!)

            await psocket[p]!.connect('1', '1')
            expect(psocket[p]!.id).not.toBe('')
            expect(pstate[p]!.sessionId).toBe('1')
            expect(psocket[p]!.isHost).toBe(false)
        }

        // Cleanly disconnect half of the players
        for (const p of itemsFrom(0, PLAYERS / 2)) {
            activatePinia(players[p]!)

            psocket[p]!.disconnect()
            expect(psocket[p]!.id).toBe('')
            expect(pstate[p]!.sessionId).toBe('')
            expect(psocket[p]!.isHost).toBe(true)
        }

        // Force disconnect the other half of the players
        hsocket.closeTownsquare()
        await new Promise(resolve => setTimeout(resolve, DELAY))

        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
            activatePinia(players[p]!)
            expect(psocket[p]!.id).toBe('')
            expect(pstate[p]!.sessionId).toBe('')
            expect(psocket[p]!.isHost).toBe(true)
        }
    })

    it('syncs state on connect', async () => {
        activatePinia(host)
        hgame.loadScript(["chef", "undertaker", "oracle", "sage", "ravenkeeper", "mayor", "recluse", "lunatic", "poisoner", "spy", "zombuul", "sentinel"])

        expect(hstate.edition?.roles.length).toEqual(12)
        expect(hgame.availableRoles.length).toEqual(11)
        expect(hgame.assignedFabled.length).toEqual(1)

        // Connect second half after script load
        for (const p of itemsFrom(0, PLAYERS)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
        }

        // Check that all players have the same state
        for (const p of itemsFrom(0, PLAYERS)) {
            activatePinia(players[p]!)
            expect(pgame[p]!.edition?.roles.length).toEqual(12)
            expect(pgame[p]!.availableRoles.length).toEqual(11)
            expect(pgame[p]!.assignedFabled.length).toEqual(1)
        }
    })

    it('syncs on host state change', async () => {
        for (const p of itemsFrom(0, PLAYERS))
            hplayers.add(`Player ${p + 1}`)

        for (const p of itemsFrom(0, PLAYERS)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
        }

        // Load the script
        activatePinia(host)
        hgame.loadScript(["chef", "undertaker", "oracle", "sage", "ravenkeeper", "mayor", "recluse", "lunatic", "poisoner", "spy", "zombuul", "sentinel"])
        await new Promise(resolve => setTimeout(resolve, DELAY))

        for (const p of itemsFrom(0, PLAYERS)) {
            activatePinia(players[p]!)
            expect(pgame[p]!.edition?.roles.length).toEqual(12)
            expect(pgame[p]!.availableRoles.length).toEqual(11)
            expect(pgame[p]!.assignedFabled.length).toEqual(1)
        }

        // Toggle a few fabled and loric
        activatePinia(host)
        hgame.toggleModifier('fabled', 'angel')
        hgame.toggleModifier('fabled', 'duchess')
        hgame.toggleModifier('fabled', 'ferryman')
        hgame.toggleModifier('fabled', 'ferryman')  // enable and disable to test that it works

        hgame.toggleModifier('loric', 'pope')

        await new Promise(resolve => setTimeout(resolve, DELAY))
        for (const p of itemsFrom(0, PLAYERS)) {
            activatePinia(players[p]!)
            expect(pgame[p]!.assignedFabled.map(f => f.id)).toContain('angel')
            expect(pgame[p]!.assignedFabled.map(f => f.id)).toContain('duchess')
            expect(pgame[p]!.assignedFabled.map(f => f.id)).not.toContain('ferryman')

            expect(pgame[p]!.assignedLoric.map(l => l.id)).toContain('pope')
        }
    })

    it('allows claiming seats', async () => {
        for (const p of itemsFrom(0, PLAYERS / 2))
            hplayers.add(`Player ${p + 1}`)

        for (const p of itemsFrom(0, PLAYERS / 2)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            psocket[p]!.requestClaim(p)
        }

        await new Promise(resolve => setTimeout(resolve, DELAY))
        // Expect correct seat index for each player
        for (const p of itemsFrom(0, PLAYERS / 2)) {
            activatePinia(players[p]!)
            expect(psocket[p]?.seatIndex).toEqual(p)
            expect(hplayers.list[p]?.socketId).not.toBe(undefined)
        }

        // Try to claim already occupied seats
        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            psocket[p]!.requestClaim(p - PLAYERS / 2)
        }

        // Expect non-seatedindex for each player
        await new Promise(resolve => setTimeout(resolve, DELAY))
        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
            activatePinia(players[p]!)
            expect(psocket[p]?.seatIndex).toEqual(-1)
            expect(hplayers.list[p]?.socketId).toBe(undefined)
        }

        // Try to claim seat while already seated
        for (const p of itemsFrom(PLAYERS / 2, 1))
            hplayers.add(`Player ${p + 1}`)

        activatePinia(players[0]!)
        psocket[0]!.requestClaim(PLAYERS / 2)
        await new Promise(resolve => setTimeout(resolve, DELAY))
        expect(psocket[0]?.seatIndex).toEqual(0)

        // Unclaim and someone else can claim
        activatePinia(players[0]!)
        psocket[0]!.requestUnclaim()
        await new Promise(resolve => setTimeout(resolve, DELAY))
        expect(psocket[0]?.seatIndex).toEqual(-1)

        activatePinia(players[PLAYERS / 2]!)
        psocket[PLAYERS / 2]!.requestClaim(0)
        await new Promise(resolve => setTimeout(resolve, DELAY))
        expect(psocket[PLAYERS / 2]?.seatIndex).toEqual(0)
    })

    it('allows renaming', async () => {
        for (const p of itemsFrom(0, 2))
            hplayers.add(`Player ${p + 1}`)

        for (const p of itemsFrom(0, 2)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            psocket[p]!.requestClaim(p)
        }

        // Request rename
        await new Promise(resolve => setTimeout(resolve, DELAY))
        psocket[0]!.requestRename('New Name')
        await new Promise(resolve => setTimeout(resolve, DELAY))
        expect(hplayers.list[0]!.name).toEqual('New Name')
        expect(pplayers[0]!.list[0]!.name).toEqual('New Name')
        expect(pplayers[1]!.list[0]!.name).toEqual('New Name')
    })
})
