import argon2 from 'argon2'
import { sessions, createSession, townsquares } from "./live";


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
    if (!townsquareId || !townsquares.has(townsquareId)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Could not find the townsquare',
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
