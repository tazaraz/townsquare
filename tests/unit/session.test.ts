import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type Pinia, createPinia, setActivePinia } from 'pinia'
import WebSocket from 'ws'

/** Amount of players we reserve */
const PLAYERS = 4
/* We explain to vitest what the host should be */
const HOST = 'localhost:3000'
/** Time the host should wait for all changes to process */
const DELAY = 200
/** The session for this test */
const SESSION = '22222'


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


/**
 * Creates an iterable of numbers from start to end (exclusive).
 * @param start Start of the range
 * @param end End of the range
 */
export function range(start: number, end: number) {
    return Array(Math.floor(end - start)).fill(0).map((_, i) => Math.floor(start) + i).values()
}


describe('Session', () => {
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

    async function createSeatedPlayers(start: number, end: number) {
        for (const p of range(start, end))
            hplayers.add(`Player ${p + 1}`)

        for (const p of range(start, end)) {
            activatePinia(players[p]!)
            await psocket[p]!.connect(SESSION, SESSION)
            psocket[p]!.requestClaim(p)
        }
        await delay()
    }

    const delay = () => new Promise(resolve => setTimeout(resolve, DELAY))

    beforeEach(async () => {
        host = createPinia()
        activatePinia(host)

        hstate = useGamestate()
        hgame = useGame()
        hplayers = usePlayers()
        hsocket = useSocket()

        pstate.length = 0
        pgame.length = 0
        pplayers.length = 0
        psocket.length = 0
        players.length = 0

        for (const p of Array(PLAYERS).keys()) {
            players.push(createPinia())
            activatePinia(players[p]!)

            pstate.push(useGamestate())
            pgame.push(useGame())
            pplayers.push(usePlayers())
            psocket.push(useSocket())
        }

        activatePinia(host)
        const session = await hsocket.create(SESSION, SESSION)
        if (session)
            expect.fail(session.text)
    })

    afterEach(() => {
        activatePinia(host)
        hsocket.closeTownsquare();
    })

    // it('allows (un)claiming seats', async () => {
    //     await createSeatedPlayers(0, PLAYERS / 2)

    //     // Expect correct seat index for each player
    //     for (const p of range(0, PLAYERS / 2)) {
    //         activatePinia(players[p]!)
    //         expect(psocket[p]?.seatIndex).toEqual(p)
    //         expect(hplayers.get(p)?.socketId).not.toBe(undefined)
    //     }

    //     // Try to claim already occupied seats
    //     for (const p of range(PLAYERS / 2, PLAYERS)) {
    //         activatePinia(players[p]!)
    //         await psocket[p]!.connect(SESSION, SESSION)
    //         psocket[p]!.requestClaim(p - PLAYERS / 2)
    //     }

    //     // Expect non-seatedindex for each player
    //     await delay()
    //     for (const p of range(PLAYERS / 2, PLAYERS)) {
    //         activatePinia(players[p]!)
    //         expect(psocket[p]?.seatIndex).toEqual(-1)
    //         expect(hplayers.get(p)?.socketId).toBe(undefined)
    //     }

    //     // Try to claim seat while already seated
    //     for (const p of range(PLAYERS / 2, PLAYERS / 2 + 1))
    //         hplayers.add(`Player ${p + 1}`)

    //     activatePinia(players[0]!)
    //     psocket[0]!.requestClaim(PLAYERS / 2)
    //     await delay()
    //     expect(psocket[0]?.seatIndex).toEqual(0)

    //     // Unclaim and someone else can claim
    //     activatePinia(players[0]!)
    //     psocket[0]!.requestUnclaim()
    //     await delay()
    //     expect(psocket[0]?.seatIndex).toEqual(-1)

    //     activatePinia(players[PLAYERS / 2]!)
    //     psocket[PLAYERS / 2]!.requestClaim(0)
    //     await delay()
    //     expect(psocket[PLAYERS / 2]?.seatIndex).toEqual(0)
    // })

    it('allows renaming', async () => {
        await createSeatedPlayers(0, 2)

        // Request rename
        await delay()
        activatePinia(players[0]!);
        psocket[0]!.requestRename('New Name')
        await delay()
        expect(hplayers.get(0)!.name).toEqual('New Name')
        expect(pplayers[0]!.list[0]!.name).toEqual('New Name')
        expect(pplayers[1]!.list[0]!.name).toEqual('New Name')
    })

    // it('processes swaps correctly', async () => {
    //     await createSeatedPlayers(0, PLAYERS)

    //     // Do a swap
    //     activatePinia(host);
    //     hplayers.swap(1, 2)
    //     await delay()

    //     expect(hplayers.get(1)?.name).toEqual('Player 3')
    //     expect(hplayers.get(2)?.name).toEqual('Player 2')

    //     for (const p of range(0, PLAYERS)) {
    //         activatePinia(players[p]!)
    //         expect(pplayers[p]?.list[1]?.name).toEqual('Player 3')
    //         expect(pplayers[p]?.list[2]?.name).toEqual('Player 2')
    //     }
    // })

    // it('syncs roles and bluffs correctly', async () => {
    //     await createSeatedPlayers(0, PLAYERS)

    //     // Set bluffs
    //     activatePinia(host)
    //     hgame.loadScript('tb')
    //     hplayers.setRole(0, 'undertaker')
    //     hplayers.setRole(1, 'monk')
    //     hplayers.setRole(2, 'saint')
    //     hplayers.setRole(3, 'imp')

    //     hgame.setBluff(0, 'mayor')
    //     hgame.setBluff(2, 'baron')
    //     await delay()

    //     expect(hstate.demonBluffs[0]?.id).toEqual('mayor')
    //     expect(hstate.demonBluffs[2]?.id).toEqual('baron')

    //     hsocket.syncDataToPlayers()
    //     await delay()

    //     activatePinia(players[0]!)
    //     expect(pplayers[0]!.list.map(r => r.role?.id)).toEqual(['undertaker', undefined, undefined, undefined])
    //     expect(pstate[0]!.demonBluffs.map(b => b?.id)).toEqual([undefined, undefined, undefined])

    //     activatePinia(players[1]!)
    //     expect(pplayers[1]!.list.map(r => r.role?.id)).toEqual([undefined, 'monk', undefined, undefined])
    //     expect(pstate[1]!.demonBluffs.map(b => b?.id)).toEqual([undefined, undefined, undefined])

    //     activatePinia(players[2]!)
    //     expect(pplayers[2]!.list.map(r => r.role?.id)).toEqual([undefined, undefined, 'saint', undefined])
    //     expect(pstate[2]!.demonBluffs.map(b => b?.id)).toEqual([undefined, undefined, undefined])

    //     activatePinia(players[3]!)
    //     expect(pplayers[3]!.list.map(r => r.role?.id)).toEqual([undefined, undefined, undefined, 'imp'])
    //     expect(pstate[3]!.demonBluffs.map(b => b?.id)).toEqual(['mayor', undefined, 'baron'])
    // })
})
