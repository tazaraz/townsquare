import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type Pinia, createPinia, setActivePinia } from 'pinia'
import WebSocket from 'ws'


const PLAYERS = 8
/* We explain to vitest what the host should be */
const HOST = 'localhost:3000'


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
        await new Promise(resolve => setTimeout(resolve, 500))

        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
            activatePinia(players[p]!)
            expect(psocket[p]!.id).toBe('')
            expect(pstate[p]!.sessionId).toBe('')
            expect(psocket[p]!.isHost).toBe(true)
        }
    })

    it('syncs state on connect', async () => {
        // Connect first half
        for (const p of itemsFrom(0, PLAYERS / 2)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            expect(pgame[p]!.edition?.roles.length).toBeFalsy()
            expect(pgame[p]!.availableRoles.length).toEqual(0)
        }

        activatePinia(host)
        hgame.loadScript(["chef", "undertaker", "oracle", "sage", "ravenkeeper", "mayor", "recluse", "lunatic", "poisoner", "spy", "zombuul", "sentinel"])
        for (const p of itemsFrom(0, PLAYERS / 2))
            hplayers.add(`Player ${p + 1}`)

        expect(hstate.edition?.roles.length).toEqual(12)
        expect(hgame.availableRoles.length).toEqual(11)
        expect(hgame.assignedFabled.length).toEqual(1)

        // Connect second half after script load
        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
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

    it('allows claiming', async () => {
        for (const p of itemsFrom(0, PLAYERS / 2))
            hplayers.add(`Player ${p + 1}`)

        for (const p of itemsFrom(0, PLAYERS / 2)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            console.log(p, psocket[p]?.seatIndex)
            psocket[p]!.requestClaim(p)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        // Expect correct seat index for each player
        for (const p of itemsFrom(0, PLAYERS / 2)) {
            activatePinia(players[p]!)
            console.log(p, psocket[p]?.seatIndex)
            expect(psocket[p]?.seatIndex).toEqual(p)
        }

        // Try to claim already occupied seats
        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            psocket[p]!.requestClaim(p - PLAYERS / 2)
        }

        await new Promise(resolve => setTimeout(resolve, 500))
        // Expect non-seatedindex for each player
        for (const p of itemsFrom(PLAYERS / 2, PLAYERS / 2)) {
            activatePinia(players[p]!)
            expect(psocket[p]?.seatIndex).toEqual(-1)
        }
    })

    // it('allows renaming', () => {
    //     for (const p of itemsFrom(0, PLAYERS / 2))
    //         hplayers.add(`Player ${p + 1}`)
    // })
})
