import argon2 from 'argon2'
import { sessions, createSession, townsquares } from "./live";


// townsquare/[id]/auth
export default defineEventHandler(async (event) => {
    const townsquareId = getRouterParam(event, 'id');
    const password = (await readBody<{ password?: string }>(event))?.password

    let id = parseCookies(event)['id']
    let token = parseCookies(event)['token']

     // Make sure we have the id of the townsquare we want to join
    if (!townsquareId || !townsquares.has(townsquareId)) {
        throw createError({
            statusCode: 404,
            statusMessage: `Could not find townsquare '${townsquareId}'`,
        })
    }

    // Check if the token is valid
    if (!id || !token ||
        !sessions.get(id)?.token ||
        sessions.get(id)?.token !== token ||
        sessions.get(id)?.townsquare !== townsquareId) {
        // Something is not right. Delete the token cookie and ask for reauth using a password
        deleteCookie(event, 'id');
        deleteCookie(event, 'token');
        id = undefined;

        if (!townsquareId || !password) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Your session expired. Please log in again',
            })
        }
    }

    // If we do not have an id, then we are reauthing. Make sure we have a password and a townsquareId
    if (!id) {
        // Make sure a password is supplied
        if (!password) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Password is required',
            })
        }

        // Check if the password is valid
        const valid = await argon2.verify(
            townsquares.get(townsquareId)!.passwordHash,
            password,
        )
        if (!valid) {
            throw createError({
                statusCode: 401,
                statusMessage: 'The storyteller does not approve of your password',
            })
        }
    }


    // Check if this user not is reauthing
    if (!id) {
        const session = createSession(townsquareId)
        sessions.set(session.id, session)

        // Set token cookie inaccesible by js
        setCookie(event, 'token', `${session.token}`, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        })

        setCookie(event, 'id', `${session.id}`, {
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        })
    }
})
