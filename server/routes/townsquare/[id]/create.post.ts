import argon2 from 'argon2'
import { townsquares, createSession, sessions } from "./live";


// townsquare/[id]/auth
export default defineEventHandler(async (event) => {
    const townsquareId = getRouterParam(event, 'id');
    const password = (await readBody<{ password?: string }>(event)).password

    // Make sure a password is supplied
    if (!password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Password is required',
        })
    }

    // Make sure we have the id of the townsquare we want to join
    if (!townsquareId || !/^[A-Za-z0-9_-]+$/.test(townsquareId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Townsquare ID is not valid',
        })
    }


    if (townsquares.has(townsquareId)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Townsquare ID is already in use',
        })
    }

    const host = createSession(townsquareId)

    sessions.set(host.id, host)
    townsquares.set(townsquareId, {
        id: townsquareId,
        passwordHash: await argon2.hash(password, {
            type: argon2.argon2id,
        }),
        host: host.id,
        users: new Set(),
        lastActivity: Date.now()
    })

    // Set non-javascript readable cookie
    setCookie(event, 'token', `${host.token}`, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    })

    setCookie(event, 'id', `${host.id}`, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    })

    setResponseStatus(event, 201)
})
