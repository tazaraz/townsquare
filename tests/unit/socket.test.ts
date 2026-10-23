import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { range, delay, Connection } from '../helper'

/** Amount of players we reserve */
const PLAYERS = 4
/** The session for this test */
const SESSION = '11111'


describe('Socket connection', () => {
    const c = new Connection()

    beforeEach(async () => {
        await c.create(PLAYERS, SESSION)
    })

    afterEach(() => {
        c.stop()
    })

    it('connects and disconnects', async () => {
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)

            await c.psocket[p]!.connect(SESSION, SESSION)
            expect(c.psocket[p]!.id).not.toBe('')
            expect(c.pstate[p]!.sessionId).toBe(SESSION)
            expect(c.psocket[p]!.isHost).toBe(false)
        }

        // Cleanly disconnect half of the players
        for (const p of range(0, PLAYERS / 2)) {
            c.activatePinia(c.players[p]!)

            c.psocket[p]!.disconnect()
            expect(c.psocket[p]!.id).toBe('')
            expect(c.pstate[p]!.sessionId).toBe('')
            expect(c.psocket[p]!.isHost).toBe(true)
        }

        // Force disconnect the other half of the players
        c.hsocket.closeTownsquare()
        await delay()

        for (const p of range(PLAYERS / 2, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.psocket[p]!.id).toBe('')
            expect(c.pstate[p]!.sessionId).toBe('')
            expect(c.psocket[p]!.isHost).toBe(true)
        }
    })

    it('syncs state on connect', async () => {
        await c.connectPlayers(0, PLAYERS / 2, false)

        c.activatePinia(c.host)
        c.hgame.loadScript(["chef", "undertaker", "oracle", "sage", "ravenkeeper", "mayor", "recluse", "lunatic", "poisoner", "spy", "zombuul", "sentinel"])
        await delay()

        expect(c.hstate.script?.roles.length).toEqual(12)
        expect(c.hgame.availableRoles.length).toEqual(11)
        expect(c.hgame.assignedFabled.length).toEqual(1)

        for (const p of range(0, PLAYERS / 2)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.script?.roles.length).toEqual(12)
            expect(c.pgame[p]!.availableRoles.length).toEqual(11)
            expect(c.pgame[p]!.assignedFabled.length).toEqual(1)
        }
        for (const p of range(PLAYERS / 2, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.script?.roles.length).toEqual(undefined)
            expect(c.pgame[p]!.availableRoles.length).toEqual(0)
            expect(c.pgame[p]!.assignedFabled.length).toEqual(0)
        }

        // Connect second half after script load
        await c.connectPlayers(PLAYERS / 2, PLAYERS, true)

        // Check that all players have the same state
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.script?.roles.length).toEqual(12)
            expect(c.pgame[p]!.availableRoles.length).toEqual(11)
            expect(c.pgame[p]!.assignedFabled.length).toEqual(1)
        }
    })

    it('syncs on host state change', async () => {
        await c.connectPlayers(0, PLAYERS, true)

        // Load the script
        c.activatePinia(c.host)
        c.hgame.loadScript(["chef", "undertaker", "oracle", "sage", "ravenkeeper", "mayor", "recluse", "lunatic", "poisoner", "spy", "zombuul", "sentinel"])
        await delay()

        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.script?.roles.length).toEqual(12)
            expect(c.pgame[p]!.availableRoles.length).toEqual(11)
            expect(c.pgame[p]!.assignedFabled.length).toEqual(1)
        }

        // Toggle a few fabled and loric
        c.activatePinia(c.host)
        c.hgame.toggleModifier('fabled', 'angel')
        c.hgame.toggleModifier('fabled', 'duchess')
        c.hgame.toggleModifier('fabled', 'ferryman')
        c.hgame.toggleModifier('fabled', 'ferryman')  // enable and disable to test that it works

        c.hgame.toggleModifier('loric', 'pope')

        await delay()
        for (const p of range(0, PLAYERS)) {
            c.activatePinia(c.players[p]!)
            expect(c.pgame[p]!.assignedFabled.map(f => f.id)).toContain('angel')
            expect(c.pgame[p]!.assignedFabled.map(f => f.id)).toContain('duchess')
            expect(c.pgame[p]!.assignedFabled.map(f => f.id)).not.toContain('ferryman')

            expect(c.pgame[p]!.assignedLoric.map(l => l.id)).toContain('pope')
        }
    })

    it('prevents unauthorized messages', async () => {
        await c.connectPlayers(0, PLAYERS, true)

        await delay()
        expect(c.hplayers.length).toBe(4)

        // For each possible message, send it from a player and ensure the host does not receive it.
        // Either something crashes, the host receives a message, or nothing happens (desired).
        c.activatePinia(c.players[0]!)
        for (const kind of [
            'message',
          // Sync
          'sync', 'script', 'state', 'player', 'role', 'modifier', 'bluffs', 'kick', 'history',
          // UI state change
          'swap', 'grimoire', 'nomination',
          // Player actions
          'claim', 'unclaim', 'rename', 'nominate', 'vote',
          // Server specific
          'ping', 'pong', 'error', 'notification', 'leave', 'connected', 'close'
        ] as const) {
            c.psocket[0]!.sendTo('host', kind, { index: 1 })
            c.psocket[0]!.broadcast(kind, { index: 1 })
        }

        await delay()
    })
})
