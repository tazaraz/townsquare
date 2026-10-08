import { randomBytes, randomUUID } from 'node:crypto'
import type { Peer } from 'crossws'

const TOWNSQUARE_MAX_INACTIVITY = 14400000  // 4h
const PING_INTERVAL = 30000;                // 30s

interface Message extends Object {
    /** If this is a broadcasting message instead of a 1-to-1 message */
    broadcast?: boolean
    /**
     * What kind of message is being sent. All data has to come from the host/storyteller
     */
    kind: 'message' |
          // Sync
          'sync' | 'script' | 'grimoire' | 'state' | 'player' | 'role' | 'modifier' | 'swap' | 'bluffs' |
          // UI state change
          'nominated' | 'marked' | 'night' | 'votelocked' |
          // Player actions
          'claim' | 'unclaim' | 'rename' | 'nominate' | 'voting' |
          // Server specific
          'ping' | 'pong' | 'error' | 'leave' | 'connected' | 'close'
    // TODO: 'grimoire' | 'nominate' | 'voting' | 'nominated' | 'marked' | 'night' | 'votelocked'

    /** The payload */
    data: any
}

export interface SendMessage extends Message {
    /** Must be set if `broadcast !== true` */
    to?: Session['id'] | 'host'
}

export interface ReceiveMessage extends Message {
    /** The origin of the message. Set by server */
    origin: Session['id']
}


export interface Session {
    /** internal UUID of the connection */
    id: string
    /** Token handed out to the player */
    token: string
    /** The townsquare associated with this session */
    townsquare: string
    /** Websocket peer */
    peer?: Peer

    /** How many messages have been send in a second */
    messageCount: number
    /** Whether this player is still responsive */
    alive: boolean
}

interface Townsquare {
    /** Id of the townsquare  */
    id: string
    /** Hashed password */
    passwordHash: string

    /** The uuid connection of the host */
    host: Session['id']
    /** Set of uuid Connections */
    users: Set<Session['id']>

    /** Last time something happend in this townsquare */
    lastActivity: number
}

export const sessions = new Map<Session['id'], Session>()
export const townsquares = new Map<Townsquare['id'], Townsquare>()

/**
 * Creates a server side instance of a user connection
 * @returns A connection definition
 */
export function createSession(townsquare: string): Session {
    return {
        id: randomUUID(),
        token: randomBytes(32).toString('hex'),
        townsquare,

        messageCount: 0,
        alive: true,
    }
}

/**
 * Creates an error `Message` to send
 * @param error The error information to send
 */
function createErrorMessage(error: string): ReceiveMessage {
    return {
        origin: 'server',
        kind: 'error',
        data: error
    }
}

function getTownsquareId(peer: Peer) {
    return peer.request!.url.match(/\/townsquare\/([^\/]+)/)?.[1]
}

// townsquare/[id]
export default defineWebSocketHandler({
    async open(peer) {
        // Get the cookies
        const cookieHeader = peer.request.headers.get('cookie')
        if (!cookieHeader) return peer.close(1008, 'Missing session token')

        // Parse the cookies
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(cookie => {
                const [key, ...value] = cookie.trim().split('=')
                return [key, decodeURIComponent(value.join('='))]
            }),
        )

        // Check for the cookie
        const token = cookies.token
        if (!token) return peer.close(1008, 'Missing token')

        // Unpack data
        const id = getTownsquareId(peer)

        // Check validity
        const session = sessions.get(cookies.id)
        if (!id || !session || session.token !== token || session.townsquare !== id || !townsquares.get(id))
            return peer.close(1008, 'Invalid session')

        // Add the user
        session.alive = true;
        session.peer = peer

        // Don't add if it is the host
        if (townsquares.get(id)!.host !== session.id)
            townsquares.get(id)!.users.add(session.id)

        // Clarify for the user whether they are noted in this session as the host
        peer.send({
            origin: 'server',
            kind: 'connected',
            data: { isHost: townsquares.get(id)!.host === session.id }
        } satisfies ReceiveMessage)
    },

    close(peer, details) {
        // Get the townsquare id
        const id = getTownsquareId(peer)
        const session = sessions.values().find(c => c.peer?.id == peer.id);

        // Sanity check
        if (!session) {
            return
        }

        if (!id) {
            console.error(`The townsquare '${id}' does not exist`)
            return
        }

        // Notify the host of the disconnect. They can broadcast it to the players
        sessions.get(townsquares.get(id)?.host!)?.peer?.send({
            origin: 'server',
            kind: 'leave',
            data: { id: session.id }
        } satisfies ReceiveMessage)

        townsquares.get(id)?.users.delete(session.id)
    },

    message(peer, message_raw) {
        const id = getTownsquareId(peer)

        if (!id) {
            peer.close(1008, 'Could not find your session')
            return
        }

        if (!townsquares.has(id)) {
            peer.close(1001, 'This townsquare has not seen activity for too long.')
            return
        }

        const session = sessions.values().find(c => c.peer?.id == peer.id);
        // Sanity check
        if (!session) {
            console.error(`Could not find ${peer.id} for communication`)
            peer.send(createErrorMessage('Could not find your session on the server'))
            return
        }

        // If this is not the host, apply rate limiting
        if (!sessions.get(townsquares.get(id)!.host)?.peer?.id ||  // prevent compare against undefined
             sessions.get(townsquares.get(id)!.host)!.peer!.id !== peer.id) {
            // Send warning after 3 messages per second (PING_INTERVAL window size)
            if (session.messageCount++ > (3 * PING_INTERVAL) / 1000)
                peer.send(createErrorMessage('You are sending too many data packets. Slow down what you\'re doing!'))

            // Kick after 5 messages per second
            if (session.messageCount++ > (5 * PING_INTERVAL) / 1000) {
                peer.close(1008, 'You have been kicked due to spamming')
                sessions.get(townsquares.get(id)!.host)?.peer?.send({
                    origin: 'server',
                    kind: 'leave',
                    data: {
                        id: session.id,
                        reason: 'has been kicked due to spamming.'
                    }
                } satisfies ReceiveMessage)

                return
            }
        }

        try {
            let message: SendMessage = message_raw.json()

            // Do ping pong if required
            if (message.kind == 'pong') {
                if (!session.alive) {
                    // Reset the statistics
                    session.alive = true;
                    session.messageCount = 0;
                }
                return
            }

            // Close the townsquare if the host leaves
            if (message.kind == 'close') {
                // Ensure this is the host
                if (peer.id === sessions.get(townsquares.get(id)!.host)?.peer?.id) {
                    for (const connectionId of townsquares.get(id)!.users) {
                        sessions.get(connectionId)?.peer?.close(1001, 'The host has closed this townsquare.')
                        sessions.delete(connectionId)
                    }

                    townsquares.delete(id)
                }
                return;
            }

            // Broadcast the message
            if (message.broadcast === true) {
                // Only the host can do this
                if (peer.id !== sessions.get(townsquares.get(id)!.host)?.peer?.id)
                    return;

                console.log(`Broadcasting message from ${session.id} to ${townsquares.get(id)!.users.size} users`)

                // Send to everyone
                townsquares.get(id)!.users.forEach(u => {
                    sessions.get(u)!.peer!.send({
                        origin: session.id,
                        kind: message.kind,
                        data: message.data
                    } satisfies ReceiveMessage)
                })
            }

            // Or just send to the defined recipient
            else {
                /**
                 * Check if:
                 *  - The message is valid
                 *  - Is not reaching an unrelated peer
                 */
                const to = message.to === 'host'
                    ? sessions.get(townsquares.get(id)!.host)
                    : sessions.get(message.to!)
                if (!to) {
                    peer.send(createErrorMessage(`'${message.to}' is not a valid recipient`))
                    return
                }

                // Prevent the host sending to the host
                if (peer.id === to.peer?.id) {
                    peer.send(createErrorMessage('You cannot send messages to yourself'))
                    return
                }

                if (!message.to || !to ||
                    // Make sure our target is inside this townsquare. We are not going to tell you you hit a valid id.
                    (to && !townsquares.get(id)!.users.has(to.id) && !(townsquares.get(id)!.host === to.id))
                ) {
                    peer.send(createErrorMessage('Malformed message'))
                    return
                }

                // Make sure the player exists
                if (!townsquares.get(id)!.users.has(to.id) && townsquares.get(id)!.host !== to.id) {
                    peer.send(createErrorMessage(`Could not find receipient '${message.to}'`))
                    return;
                }

                sessions.get(to.id)!.peer!.send({
                    kind: message.kind,
                    origin: session.id,
                    data: message.data,
                } satisfies ReceiveMessage)
            }
        } catch {
            peer.send(createErrorMessage('Malformed message'))
        }
    },

    error(peer, error) {
        console.error("Error:", error);
    },
})


/**
 * Ensures players are actually connected
 */
const pingpong = setInterval(() => {
    for (const [id, connection] of sessions) {
        // Close the connection if it wasn't alive since previous ping-pong
        if (!connection.alive && connection.peer) {
            connection.peer?.terminate()
            connection.peer = undefined
            continue
        }

        connection.alive = false;
        connection.peer?.send({ origin: 'server', kind: 'ping', data: undefined} satisfies ReceiveMessage)
    }
}, PING_INTERVAL)

/**
 * Removes Townsquares which are not active anymore.
 */
const towncleanup = setInterval(() => {
    const date = Date.now()
    for (const [_, townsquare] of townsquares) {
        // If the town has been inactive for four hours, delete
        if (townsquare.lastActivity < date - TOWNSQUARE_MAX_INACTIVITY) {
            // Close the user session
            for (const connectionId of townsquare.users) {
                sessions.get(connectionId)?.peer?.close(1001, 'This townsquare has not seen activity for too long.')
                sessions.delete(connectionId)
            }

            // Delete the townsquare itself
            townsquares.delete(townsquare.id)
        }
    }
}, TOWNSQUARE_MAX_INACTIVITY)
