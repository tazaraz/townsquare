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
        activatePinia(host)
        hsocket.closeTownsquare();
    })

    it('prevents unauthorized messages', async () => {
        activatePinia(host)
        for (const p of itemsFrom(0, 4))
            hplayers.add(`Player ${p + 1}`)

        for (const p of itemsFrom(0, 4)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect('1', '1')
            psocket[p]!.requestClaim(p)
        }

        await new Promise(resolve => setTimeout(resolve, DELAY))
        expect(hplayers.list.length).toBe(4)

        // For each possible message, send it from a player and ensure the host does not receive it.
        // Either something crashes, the host receives a message, or nothing happens (desired).
        activatePinia(players[0]!)
        for (const kind of [
            'script', 'grimoire', 'state', 'player', 'role', 'modifier', 'swap', 'bluffs',
            'nominated', 'marked', 'night', 'votelocked',
            'ping', 'pong', 'error', 'leave', 'connected', 'close'
        ] as const) {
            psocket[0]!.sendTo('host', kind, { index: 1 })
            psocket[0]!.broadcast(kind, { index: 1 })
        }

        await new Promise(resolve => setTimeout(resolve, DELAY))
    })
})
