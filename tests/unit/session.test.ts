import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { range, delay, Connection } from '../helper'

/** Amount of players we reserve */
const PLAYERS = 4
/** The session for this test */
const SESSION = '22222'


describe('Session', () => {
    const c = new Connection()

    beforeEach(async () => {
        await c.create(PLAYERS, SESSION)
    })

    afterEach(() => {
        c.stop()
    })

    it('allows (un)claiming seats', async () => {
        await c.connectPlayers(0, PLAYERS / 2)

        // Expect correct seat index for each player
        for (const p of range(0, PLAYERS / 2)) {
            c.activatePinia(c.players[p]!)
            expect(c.psocket[p]?.seatIndex).toEqual(p)
            expect(c.hplayers.get(p)?.socketId).not.toBe(undefined)
        }

        // Try to claim already occupied seats
        for (const p of range(PLAYERS / 2, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            await c.psocket[p]!.connect(SESSION, SESSION)
            c.psocket[p]!.requestClaim(p - PLAYERS / 2)
        }

        // Expect non-seatedindex for each player
        await delay()
        for (const p of range(PLAYERS / 2, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.psocket[p]?.seatIndex).toEqual(-1)
            expect(c.hplayers.get(p)?.socketId).toBe(undefined)
        }

        // Try to claim seat while already seated
        for (const p of range(PLAYERS / 2, PLAYERS / 2 + 1))
            c.hplayers.add(`Player ${p + 1}`)

        c.activatePinia(c.players[0]!)
        c.psocket[0]!.requestClaim(PLAYERS / 2)
        await delay()
        expect(c.psocket[0]?.seatIndex).toEqual(0)

        // Unclaim and someone else can claim
        c.activatePinia(c.players[0]!)
        c.psocket[0]!.requestUnclaim()
        await delay()
        expect(c.psocket[0]?.seatIndex).toEqual(-1)

        c.activatePinia(c.players[PLAYERS / 2]!)
        c.psocket[PLAYERS / 2]!.requestClaim(0)
        await delay()
        expect(c.psocket[PLAYERS / 2]?.seatIndex).toEqual(0)
    })

    it('allows renaming', async () => {
        await c.connectPlayers(0, 2)

        // Request rename
        await delay()
        c.activatePinia(c.players[0]!);
        c.psocket[0]!.requestRename('New Name')
        await delay()
        expect(c.hplayers.get(0)!.name).toEqual('New Name')
        expect(c.pplayers[0]!.list[0]!.name).toEqual('New Name')
        expect(c.pplayers[1]!.list[0]!.name).toEqual('New Name')
    })

    it('processes swaps correctly', async () => {
        await c.connectPlayers(0, PLAYERS)

        // Do a swap
        c.activatePinia(c.host);
        c.hplayers.swap(1, 2)
        await delay()

        expect(c.hplayers.get(1)?.name).toEqual('Player 3')
        expect(c.hplayers.get(2)?.name).toEqual('Player 2')

        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pplayers[p]?.list[1]?.name).toEqual('Player 3')
            expect(c.pplayers[p]?.list[2]?.name).toEqual('Player 2')
        }
    })

    it('syncs roles and bluffs correctly', async () => {
        await c.connectPlayers(0, PLAYERS)

        // Set bluffs
        c.activatePinia(c.host)
        c.hgame.loadScript('tb')
        c.hplayers.setRole(0, 'undertaker')
        c.hplayers.setRole(1, 'monk')
        c.hplayers.setRole(2, 'saint')
        c.hplayers.setRole(3, 'imp')

        c.hgame.setBluff(0, 'mayor')
        c.hgame.setBluff(2, 'baron')
        await delay()

        expect(c.hstate.demonBluffs[0]?.id).toEqual('mayor')
        expect(c.hstate.demonBluffs[2]?.id).toEqual('baron')

        c.hsocket.syncDataToPlayers()
        await delay()

        c.activatePinia(c.players[0]!)
        expect(c.pplayers[0]!.list.map(r => r.role?.id)).toEqual(['undertaker', undefined, undefined, undefined])
        expect(c.pstate[0]!.demonBluffs.map(b => b?.id)).toEqual([undefined, undefined, undefined])

        c.activatePinia(c.players[1]!)
        expect(c.pplayers[1]!.list.map(r => r.role?.id)).toEqual([undefined, 'monk', undefined, undefined])
        expect(c.pstate[1]!.demonBluffs.map(b => b?.id)).toEqual([undefined, undefined, undefined])

        c.activatePinia(c.players[2]!)
        expect(c.pplayers[2]!.list.map(r => r.role?.id)).toEqual([undefined, undefined, 'saint', undefined])
        expect(c.pstate[2]!.demonBluffs.map(b => b?.id)).toEqual([undefined, undefined, undefined])

        c.activatePinia(c.players[3]!)
        expect(c.pplayers[3]!.list.map(r => r.role?.id)).toEqual([undefined, undefined, undefined, 'imp'])
        expect(c.pstate[3]!.demonBluffs.map(b => b?.id)).toEqual(['mayor', undefined, 'baron'])
    })
})
