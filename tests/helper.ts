import { type Pinia, createPinia, setActivePinia } from 'pinia'
import WebSocket from 'ws'


/* We explain to vitest what the host should be */
const HOST = 'localhost:3000'

const cookies = new Map<Pinia, string>()
let activeSession: Pinia

const originalFetch = globalThis.fetch
const OriginalWebSocket = WebSocket

export function delay(time: number = 200) { return new Promise(resolve => setTimeout(resolve, time)) }

export class Connection {
    host: Pinia = null as any
    players: Pinia[] = []

    hstate: ReturnType<typeof useGamestate> = null as any
    hgame: ReturnType<typeof useGame>       = null as any
    hplayers: ReturnType<typeof usePlayers> = null as any
    hsocket: ReturnType<typeof useSocket>   = null as any

    pstate: ReturnType<typeof useGamestate>[]   = []
    pgame: ReturnType<typeof useGame>[]         = []
    pplayers: ReturnType<typeof usePlayers>[]   = []
    psocket: ReturnType<typeof useSocket>[]     = []

    private SESSION: string = ''
    private PLAYERS: number = 0

    constructor() {
        // This creates a fake fetch which will automatically add the cookie for the active session to the request, and store any cookies that are set in the response.
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
                const updatedCookies = setCookies
                    .map(cookie => cookie.split(';')[0])
                    .join('; ')

                cookies.set(activeSession, updatedCookies)

                for (const cookie of updatedCookies.split('; ')) {
                    document.cookie = cookie
                }
            }

            return response
        }

        // This creates a fake WebSocket which will automatically add the cookie for the active session to the request.
        class TestWebSocket extends OriginalWebSocket {
            constructor(
                path: string | URL,
                options?: WebSocket.ClientOptions,
            ) {
                const resolved = new URL(path.toString(), `ws://${HOST}/`)
                const cookie = cookies.get(activeSession)

                super(resolved.toString(), {
                    ...options,
                    headers: cookie
                        ? { ...options?.headers, Cookie: cookie }
                        : options?.headers,
                })
            }
        }

        globalThis.WebSocket = TestWebSocket as any
    }

    /**
     * Creates a host session and a specified number of players, and connects them to the host session.
     * @param playerCount The number of players to create and connect to the host session.
     * @param sessionId The session ID to use for the host and players.
     */
    async create(playerCount: number, sessionId: string) {
        this.host = createPinia()
        this.players = []
        this.SESSION = sessionId
        this.PLAYERS = playerCount

        this.activatePinia(this.host)

        this.hstate = useGamestate()
        this.hgame = useGame()
        this.hplayers = usePlayers()
        this.hsocket = useSocket()

        this.pstate.length = 0
        this.pgame.length = 0
        this.pplayers.length = 0
        this.psocket.length = 0
        this.players.length = 0

        for (let i = 0; i < playerCount; i++) {
            const player = createPinia()
            this.players.push(player)

            this.activatePinia(player)

            this.pstate.push(useGamestate())
            this.pgame.push(useGame())
            this.pplayers.push(usePlayers())
            this.psocket.push(useSocket())
        }

        this.activatePinia(this.host)

        const session = await this.hsocket.create(sessionId, sessionId)
        if (session) {
            throw new Error(session.text)
        }
    }

    /**
     * Connects a range of players to the host session.
     * @param start The starting index of players to connect (inclusive).
     * @param end The ending index of players to connect (exclusive).
     * @param seat Whether to seat the players after connecting. Defaults to `true`.
     */
    async connectPlayers(start: number, end: number, seat=true){
        for (const p of range(start, end))
            this.hplayers.add(`Player ${p + 1}`)

        for (const p of range(start, end)) {
            this.activatePinia(this.players[p]!)
            await this.psocket[p]!.connect(this.SESSION, this.SESSION)
            if (seat)
                this.psocket[p]!.requestClaim(p)
        }
        await delay()
    }

    /**
     * Activates the given Pinia instance and sets it as the active session.
     * @param pinia The Pinia instance to activate.
     */
    activatePinia(pinia: Pinia) {
        setActivePinia(pinia)
        activeSession = pinia

        for (const cookie of (cookies.get(pinia) ?? '').split('; ')) {
            if (cookie) document.cookie = cookie
        }
    }

    /** Stops the host session and disconnects all players. */
    stop() {
        this.activatePinia(this.host)
        this.hsocket.closeTownsquare()
        this.hsocket.disconnect()
        for (const p of range(0, this.PLAYERS)) {
            this.activatePinia(this.players[p]!)
            this.psocket[p]!.disconnect()
        }
    }
}

/**
 * Creates an iterable of numbers from start to end (exclusive).
 * @param start Start of the range
 * @param end End of the range
 */
export function range(start: number, end: number) {
    return Array(Math.floor(end - start)).fill(0).map((_, i) => Math.floor(start) + i).values()
}
