import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { range, delay, Connection } from '../helper'

import { mountSuspended } from '@nuxt/test-utils/runtime'
import Seats from '~/components/Seats.vue'



/** Amount of players we reserve */
const PLAYERS = 4
/** The session for this test */
const SESSION = '4444'
/** Speed of the hand */
const HANDSPEED = 0.5


describe('Nomination hand', () => {
    const c = new Connection()

    beforeEach(async () => {
        await c.create(PLAYERS, SESSION)
        c.activatePinia(c.host)
        c.hgame.loadScript('tb');
    })

    afterEach(() => {
        c.stop()
    })

    it('Rotates on the host', { timeout: 10000 * HANDSPEED }, async () => {
        // Mount the host Component
        const component = await mountSuspended(Seats, { global: {plugins: [ c.host ]} })
        const { nomination } = component.setupState;

        c.connectPlayers(0, PLAYERS)
        c.hplayers.setNominated(0, 1, true)
        await delay(550)

        c.activatePinia(c.host)
        c.hgame.nomination.speed = HANDSPEED
        nomination.start()

        for (const h of range(0, PLAYERS + 1)) {
            await delay(HANDSPEED * 1000)
            expect(c.hgame.nomination.hand).toEqual(h)
        }

        // End sequence
        await delay()
        expect(c.hgame.nomination.hand).toEqual(0)
        await delay(HANDSPEED * 1000)
        expect(c.hgame.nomination.hand).toEqual(-1)
    })

    it('Rotates and syncs', { timeout: 10000 * HANDSPEED }, async () => {
        // Mount the host Component
        const component = await mountSuspended(Seats, { global: {plugins: [ c.host ]} })
        const { nomination } = component.setupState;

        // Connect half the players and nominate one of them
        await c.connectPlayers(0, PLAYERS / 2)
        for (const p of range(PLAYERS / 2, PLAYERS))
            c.hplayers.add(`Player ${p + 1}`)

        c.hplayers.setNominated(0, 1, true)
        await delay(500)

        c.activatePinia(c.host)
        c.hgame.nomination.speed = HANDSPEED
        nomination.start()

        // Check sync state of the hand for all players
        for (const h of range(0, PLAYERS / 2)) {
            await delay(HANDSPEED * 1000)
            expect(c.hgame.nomination.hand).toEqual(h)

            for (const p of range(0, PLAYERS / 2)) {
                c.activatePinia(c.players[p]!)
                expect(c.pgame[p]!.nomination.hand).toEqual(h)
            }
        }

        // Midway connect more players
        for (const p of range(PLAYERS / 2, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            c.psocket[p]!.connect(SESSION, SESSION)
            c.psocket[p]!.requestClaim(p)
        }
        // Should sync correctly
        for (const h of range(PLAYERS / 2, PLAYERS + 1)) {
            await delay(HANDSPEED * 1000)
            expect(c.hgame.nomination.hand).toEqual(h)

            for (const p of range(0, PLAYERS)) {
                c.activatePinia(c.players[p]!)
                expect(c.pgame[p]!.nomination.hand).toEqual(h)
            }
        }

        // End sequence
        await delay()
        expect(c.hgame.nomination.hand).toEqual(0)
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.nomination.hand).toEqual(0)
        }

        await delay(HANDSPEED * 1000)
        expect(c.hgame.nomination.hand).toEqual(-1)
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.nomination.hand).toEqual(-1)
        }
    })

    it('Correctly stops', { timeout: 10000 * HANDSPEED }, async () => {
        // Mount the host Component
        const component = await mountSuspended(Seats, { global: {plugins: [ c.host ]} })
        const { nomination } = component.setupState;

        c.connectPlayers(0, PLAYERS)
        c.hplayers.setNominated(0, 1, true)
        await delay(500)

        c.activatePinia(c.host)
        c.hgame.nomination.speed = HANDSPEED
        nomination.start()

        for (const h of range(0, PLAYERS + 1)) {
            await delay(HANDSPEED * 1000)
            expect(c.hgame.nomination.hand).toEqual(h)

            for (const p of range(0, PLAYERS)) {
                c.activatePinia(c.players[p]!)
                expect(c.pgame[p]!.nomination.hand).toEqual(h)
            }

            // Stop the hand at 2 and break out of the loop
            if (h === 2) {
                nomination.stop()
                break;
            }
        }

        // Wait a bit and check that the hand has not moved
        await delay()
        expect(c.hgame.nomination.hand).toEqual(0)
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.nomination.hand).toEqual(0)
        }

        await delay(HANDSPEED * 1000)
        expect(c.hgame.nomination.hand).toEqual(-1)
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.nomination.hand).toEqual(-1)
        }
    })

    it('Correctly counts votes', { timeout: 10000 * HANDSPEED }, async () => {
        // Mount the host Component
        const component = await mountSuspended(Seats, { global: {plugins: [ c.host ]} })
        const { nomination } = component.setupState;

        c.connectPlayers(0, PLAYERS)
        c.hplayers.setNominated(0, 1, true)
        await delay(500)

        c.activatePinia(c.host)
        c.hgame.nomination.speed = HANDSPEED
        nomination.start()

        // Valid votes
        for (const h of range(0, PLAYERS / 2)) {
            await delay(HANDSPEED * 500)
            c.activatePinia(c.players[h]!)
            c.psocket[h]!.requestVote()
            await delay(HANDSPEED * 100)

            // Make sure state is synced for all players
            for (const p of range(0, PLAYERS)) {
                c.activatePinia(c.players[p]!)
                for (const a of range(0, PLAYERS)) {
                    // Only check players we have made vote
                    expect(c.pplayers[p]!.list[a]!.isVoting).toBe(a <= h && a < PLAYERS / 2)
                }
            }

            await delay(HANDSPEED * 400)
        }

        // Too late votes
        for (const h of range(PLAYERS / 2, PLAYERS)) {
            await delay(HANDSPEED * 900)
            c.activatePinia(c.players[h]!)
            c.psocket[h]!.requestVote()
            await delay(HANDSPEED * 100)

            // Make sure state is synced for all players
            for (const p of range(0, PLAYERS)) {
                c.activatePinia(c.players[p]!)
                for (const a of range(0, PLAYERS)) {
                    // Only check players we have made vote
                    expect(c.pplayers[p]!.list[a]!.isVoting).toBe(a <= h && a < PLAYERS / 2)
                }
            }
        }

        c.activatePinia(c.host)
        expect(c.hplayers.list.filter(p => p.isVoting).length).toBe(PLAYERS / 2)
    })
})