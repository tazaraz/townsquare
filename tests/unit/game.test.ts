import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'


describe('Game Store', () => {
    let state: ReturnType<typeof useGamestate>
    let game: ReturnType<typeof useGame>

    beforeEach(() => {
        setActivePinia(createPinia())

        state = useGamestate()
        game = useGame()
    })

    describe('Predefined Scenario', () => {
        it('loads', () => {
            game.loadScript('tb')
            expect(state.roles.map(r => r.id)).toEqual([
                "washerwoman", "librarian", "investigator", "chef", "empath", "fortuneteller", "undertaker", "monk", "ravenkeeper", "virgin", "slayer", "soldier", "mayor", "butler", "drunk", "recluse", "saint", "poisoner", "spy", "scarletwoman", "baron", "imp", "scapegoat", "gunslinger", "beggar", "bureaucrat", "thief"
            ])
            // expect(state.reminders.once.map(r => r.name)).toEqual([
            //     "Townsfolk", "Wrong", "Outsider", "Wrong", "Minion", "Wrong","Red Herring", "Died Today", "Safe", "No Ability", "No Ability", "Master", "Poisoned", "Is The Demon", "Dead", "3 Votes", "Negative Vote"
            // ])
            // expect(state.reminders.global.map(r => r.name)).toEqual([
            //     "Is The Drunk", "Good", "Evil", "Custom note"
            // ])

            game.loadScript('bmr')
            expect(state.roles.map(r => r.id)).toEqual([
                "grandmother", "sailor", "chambermaid", "exorcist", "innkeeper", "gambler", "gossip", "courtier", "professor", "minstrel", "tealady", "pacifist", "fool", "tinker", "moonchild", "goon", "lunatic", "godfather", "devilsadvocate", "assassin", "mastermind", "zombuul", "pukka", "shabaloth", "po", "butcher", "bonecollector", "harlot", "barista", "deviant"
            ])
            // expect(state.reminders.once.map(r => r.name)).toEqual([
            //     "Grandchild", "Dead", "Drunk", "Chosen", "Safe", "Safe", "Drunk", "Dead", "Dead", "Drunk 3", "Drunk 2", "Drunk 1", "No Ability", "Alive", "No Ability", "Everyone Is Drunk", "Cannot Die", "Cannot Die", "No Ability", "Dead", "Dead", "Drunk", "Chosen", "Chosen", "Chosen", "Died Today", "Dead", "Survives Execution", "Dead", "No Ability", "Died Today", "Dead", "Poisoned", "Poisoned", "Dead", "Dead", "Dead", "Alive", "Dead", "Dead", "Dead", "3 Attacks", "No Ability", "Has Ability", "Dead", "Dead", "Sober & Healthy", "Acts Twice", "?", "?"
            // ])
            // expect(state.reminders.global.map(r => r.name)).toEqual([
            //     "Good", "Evil", "Custom note",
            // ])
        })

        it('loads fabled', () => {
            game.loadScript([
                "chef", "undertaker", "oracle", "sage", "ravenkeeper", "mayor", "recluse", "lunatic", "poisoner", "spy", "zombuul", "sentinel"
            ])

            expect(state.fabled.map(f => f.id)).toEqual(["sentinel"])
        })

        it('provides fabled', () => {
            expect(game.availableFabled.length).toBe(14)
        })

        it('provides loric', () => {
            expect(game.availableLoric.length).toBe(11)
        })
    })



    describe('Custom Scenario', () => {
        it.each([
            {
                name: 'string only',
                json: ["clockmaker", "dreamer", "snakecharmer", "mathematician", "flowergirl", "towncrier", "oracle", "savant", "seamstress", "philosopher", "artist", "juggler", "sage", "mutant", "sweetheart", "barber", "klutz", "eviltwin", "witch", "cerenovus", "pithag", "fanggu", "vigormortis", "nodashii", "vortox", "apprentice", "matron", "voudon","judge", "bishop"]
            },
            {
                name: 'object only',
                json: [{ id: "clockmaker" }, { id: "dreamer" }, { id: "snakecharmer" }, { id: "mathematician" }, { id: "flowergirl" }, { id: "towncrier" }, { id: "oracle" }, { id: "savant" }, { id: "seamstress" }, { id: "philosopher" }, { id: "artist" }, { id: "juggler" }, { id: "sage" }, { id: "mutant" }, { id: "sweetheart" }, { id: "barber" }, { id: "klutz" }, { id: "eviltwin" }, { id: "witch" }, { id: "cerenovus" }, { id: "pithag" }, { id: "fanggu" }, { id: "vigormortis" }, { id: "nodashii" }, { id: "vortox" }, { id: "apprentice" }, { id: "matron" }, { id: "voudon" },"judge", { id: "bishop" }]
            },
            {
                name: 'meta + string',
                json: [{id: "_meta", name: "scenario name", author: "me"}, "clockmaker", "dreamer", "snakecharmer", "mathematician", "flowergirl", "towncrier", "oracle", "savant", "seamstress", "philosopher", "artist", "juggler", "sage", "mutant", "sweetheart", "barber", "klutz", "eviltwin", "witch", "cerenovus", "pithag", "fanggu", "vigormortis", "nodashii", "vortox", "apprentice", "matron", "voudon","judge", "bishop"]
            },
            {
                name: 'meta + object',
                json: [{id: "_meta", name: "scenario name", author: "me"}, { id: "clockmaker" }, { id: "dreamer" }, { id: "snakecharmer" }, { id: "mathematician" }, { id: "flowergirl" }, { id: "towncrier" }, { id: "oracle" }, { id: "savant" }, { id: "seamstress" }, { id: "philosopher" }, { id: "artist" }, { id: "juggler" }, { id: "sage" }, { id: "mutant" }, { id: "sweetheart" }, { id: "barber" }, { id: "klutz" }, { id: "eviltwin" }, { id: "witch" }, { id: "cerenovus" }, { id: "pithag" }, { id: "fanggu" }, { id: "vigormortis" }, { id: "nodashii" }, { id: "vortox" }, { id: "apprentice" }, { id: "matron" }, { id: "voudon" },"judge", { id: "bishop" }]
            },
        ])('loads $name', ({ json }) => {
            game.loadScript(json as any)

            expect(state.roles.map(r => r.id)).toEqual([
                "clockmaker", "dreamer", "snakecharmer", "mathematician", "flowergirl", "towncrier", "oracle", "savant", "seamstress", "philosopher", "artist", "juggler", "sage", "mutant", "sweetheart", "barber", "klutz", "eviltwin", "witch", "cerenovus", "pithag", "fanggu", "vigormortis", "nodashii", "vortox", "apprentice", "matron", "voudon","judge", "bishop"
            ])

            // expect(state.reminders.once.map(r => r.name)).toEqual([
            //     "Poisoned", "Abnormal", "Abnormal", "Abnormal", "Abnormal", "Abnormal", "Demon Voted", "Demon Not Voted", "Minions Not Nominated", "Minion Nominated", "No Ability", "Drunk", "No Ability", "Correct", "Correct", "Correct", "Correct", "Correct", "Drunk", "Haircuts Tonight", "Twin", "Cursed", "Mad", "Dead", "Once", "Dead", "Has Ability", "Has Ability", "Has Ability", "Poisoned", "Poisoned", "Poisoned", "Dead", "Poisoned", "Poisoned", "Dead", "Is The Apprentice", "Nominate Good", "Nominate Evil"
            // ])
        })

        it.each([
            {
                name: 'non-existent role',
                json: ['clockmaker', 'somerole', "otherrole"]
            },
            {
                name: 'wrong meta',
                json: [{ id: '_meta' }, "clockmaker", "dreamer", "snakecharmer", "mathematician", "flowergirl", "towncrier", "oracle"]
            },
        ])('detects incorrect json: $name', ({ json }) => {
            expect(() => game.loadScript(json as any)).toThrow()
        })
    })

    describe('toggles', () => {
        it('fabled correctly', () => {
            for (const fabled of game.availableFabled)
                game.toggleModifier('fabled', fabled.id)

            expect(state.fabled.length).toBe(game.availableFabled.length)

            for (const fabled of game.availableFabled)
                game.toggleModifier('fabled', fabled.id)

            expect(state.fabled.length).toBe(0)
        })

        it('loric correctly', () => {

            for (const loric of game.availableLoric)
                game.toggleModifier('loric', loric.name)

            expect(state.loric.length).toBe(game.availableLoric.length)

            for (const loric of game.availableLoric)
                game.toggleModifier('loric', loric.name)

            expect(state.fabled.length).toBe(0)

        })
    })
})