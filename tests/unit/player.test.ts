import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'


describe('Player Store', () => {
    let state: ReturnType<typeof useGamestate>
    let game: ReturnType<typeof useGame>
    let players: ReturnType<typeof usePlayers>

    beforeEach(() => {
        setActivePinia(createPinia())

        state = useGamestate()
        game = useGame()
        players = usePlayers()
    })

    it('adds and removes', () => {
        for (const p of Array(8).keys())
            players.add(p.toString())

        for (const p of Array(8).keys())
            expect(state.players[p]!.name).toBe(p.toString())

        players.remove(3)
        players.remove(1)

        expect(state.players[1]!.name).toBe("2")
        expect(state.players[2]!.name).toBe("4")
    })

    it('swaps', () => {
        for (const p of Array(8).keys())
            players.add(p.toString())

        players.swap(1, 6)

        expect(state.players[6]!.name).toBe('1')
        expect(state.players[1]!.name).toBe('6')
    })

    describe('manages reminders', () => {
        it('available', () => {
            game.loadScenario('bmr')
            for (const [p, i] of ["grandmother", "sailor", "chambermaid", "exorcist", "innkeeper", "gambler"].entries()) {
                players.add(i.toString())
                players.setRole(p, i)
            }

            expect(state.players.map(p => p.role!.id)).toEqual(["grandmother", "sailor", "chambermaid", "exorcist", "innkeeper", "gambler"])
            expect(state.reminders.once.map(r => r.name)).toEqual(["Chosen", "Dead", "Grandchild", "Dead", "Safe", "Safe", "Drunk", "Drunk"])
        })

        it('assignes', () => {
            game.loadScenario('bmr')
            for (const [p, i] of ["grandmother", "sailor", "chambermaid", "exorcist", "innkeeper", "gambler"].entries()) {
                players.add(i.toString())
                players.setRole(p, i)
            }

            players.setReminder(1, state.reminders.once.find(r => r.name == "Grandchild")!)
            players.setReminder(1, state.reminders.once.find(r => r.name == "Chosen")!)

            expect(state.reminders.once.map(r => r.name)).toEqual(["Dead", "Dead", "Safe", "Safe", "Drunk", "Drunk"])
            expect(players.get(1)?.reminders.map(r => r.name)).toEqual(["Grandchild", "Chosen"])

            players.removeReminder(1, 0)
            expect(players.get(1)?.reminders.map(r => r.name)).toEqual(["Chosen"])
            expect(state.reminders.once.map(r => r.name)).toEqual(["Dead", "Dead", "Grandchild", "Safe", "Safe", "Drunk", "Drunk"])
        })
    })
})