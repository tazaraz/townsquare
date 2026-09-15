import { defineStore } from 'pinia';
import editionsData from '~/components/data/editions.json'
import roleData from '~/components/data/roles.json'
import nightorderData from '~/components/data/nightorder.json'
import gameData from '~/components/data/game.json'

interface TeamDivision {
    townsfolk: number
    outsider: number
    minion: number
    demon: number
    traveller: number
}

interface Teams<T> {
    townsfolk: T
    outsider: T
    minion: T
    demon: T
    traveller: T
}

interface NightOrder {
    name: string
    image: string
    team: Team
    players: Player[]
}

export const useGame = defineStore('game', () => {
    const gamestate = useGamestate()
    const players   = usePlayers()

    /**
     * The edition and script being played
     */
    const edition = computed<Edition>(() => gamestate.edition);

    /** Contains all roles available at the moment */
    const availableRoles = computed(() => gamestate.roles);

    /** Contains all roles for each team. */
    const availableTeamRoles = computed<Teams<Role[]>>(() => {
        return {
            townsfolk:  gamestate.roles.filter(c => c.team === "townsfolk"),
            outsider:   gamestate.roles.filter(c => c.team === "outsider"),
            minion:     gamestate.roles.filter(c => c.team === "minion"),
            demon:      gamestate.roles.filter(c => c.team === "demon"),
            traveller:   gamestate.roles.filter(c => c.team === "traveller"),
        }
    })

    /** Contains all roles assigned to players */
    const assignedTeamRoles = computed<Teams<Player[]>>(() => {
        return {
            townsfolk:  players.all.filter(p => p.role?.team === "townsfolk"),
            outsider:   players.all.filter(p => p.role?.team === "outsider"),
            minion:     players.all.filter(p => p.role?.team === "minion"),
            demon:      players.all.filter(p => p.role?.team === "demon"),
            traveller:  players.all.filter(p => p.role?.team === "traveller"),
        }
    })

    /**
     * What amount of players to have for each team
     */
    const division = computed<TeamDivision | null>(() => {
        // Count the number of active players
        let travellers = players.all.filter(p => p.role?.team === "traveller").length
        const divisionRuleIdx = players.count - travellers - 5

        // Make sure we have at least 5 players
        if (divisionRuleIdx < 0) return null;

        // Return the config associated with the amount of players
        return {
            ...gameData[Math.min(divisionRuleIdx, 10)]!,  // File better exist
            traveller: travellers
        }
    })

    function calculateNightOrder(): {firstNight: NightOrder[], otherNights: NightOrder[]} {
        function sortByNightOrder(roles: Role[], night: "firstNight" | "otherNight"): NightOrder[] {
            return nightorderData[night]
                // Map the role ids to the actual role objects
                .map(roleId => roles.find(r => r.id === roleId)!)
                // Remove any roles that are not in the current game
                .filter(r => r !== undefined)
                // Filter out travellers not in play
                .filter(r => r.team !== 'traveller' || 
                             (r.team === 'traveller' && players.all.some(p => p.role?.id === r.id)))
                .map(c => {
                    return {
                        name: c.name,
                        image: c.image,
                        team: c.team,
                        players: players.all.filter(p => p.role?.id === c.id)
                    }
                })
        }

        return {
            firstNight: sortByNightOrder(gamestate.roles, "firstNight"),
            otherNights: sortByNightOrder(gamestate.roles, "otherNight"),
        }
    }

    /**
     * Loads a scenario from the editions data, and populates the game state with the roles and fabled roles of that edition
     * @param game Either an array of role ids (for custom scripts), or an edition id (for predefined editions)
     */
    function loadScenario(game: string[] | EditionId) {
        // If the game is a custom script, we will have an array of role ids
        if (Array.isArray(game)) {
            gamestate.edition = {
                id: "custom" as EditionId,
                name: "Custom script",
                roles: game,
            }
        }

        // There is an actual object to load
        else {
            const raw = editionsData.find(e => e.id === game)
            if (!raw) throw new NotFoundError(`Edition ${game} not found in editions data`)

            if (!validEditionId(raw.id))
                throw new DataFormatError(`Invalid edition id: ${raw.id}`)

            gamestate.edition = {
                id: raw.id,
                name: raw.name,
                author: raw.author,
                description: raw.description,
                level: raw.level as keyof Edition['level'],
                roles: raw.roles,
            }
        }

        // Load the roles and fabled roles
        for (const charId of gamestate.edition.roles) {
            let char: Role | null = null;
            // Get the role from the roles data
            if (!(char = loadRole(charId))) {
                throw new NotFoundError(`Role ${charId} not found in the role data`)
            }

            switch (char.team) {
                case "townsfolk":
                case "outsider":
                case "minion":
                case "demon":
                case "traveller":
                    gamestate.roles.push(char)
                    break;
                case "fabled":
                    gamestate.fabled.push(char)
                    break;
                case "loric":
                    gamestate.loric.push(char)
                    break;
            }
        }

        return true
    }

    /**
     * Loads a role from the roles data
     * @param id ID of the role to load
     * @returns Either the the role `object`, `null` if not found, or `DataFormatError` if the data exists but is invalid
     */
    function loadRole(id: string): Role | null {
        const raw = roleData.find(c => c.id === id)
        if (!raw) return null

        if (!validTeam(raw.team))
            throw new DataFormatError(`Invalid team for role ${raw.id}: ${raw.team}`)

        if (!validEditionId(raw.edition))
            throw new DataFormatError(`Invalid edition for role ${raw.id}: ${raw.edition}`)

        return {
            id: raw.id,
            name: raw.name,
            image: `/sprites/characters/${raw.id}.webp`,
            edition: raw.edition ?? "custom",
            team: raw.team,
            firstNightReminder: raw.firstNightReminder ?? "",
            otherNightReminder: raw.otherNightReminder ?? "",
            reminders: raw.reminders ?? [],
            remindersGlobal: raw.remindersGlobal ?? [],
            setup: raw.setup,
            ability: raw.ability,
            flavor: raw.flavor,
        }
    }

    /**
     * Loads all travellers from the roles data
     * @returns List of travellers
     */
    function loadTravellers(): Role[] {
        return roleData
            .filter(c => c.team === "traveller")
            .map(c => loadRole(c.id))
            .filter((c): c is Role => c !== null)
    }

    /** Contains selected roles during setup */
    const setupSelected = ref<Role[]>(players.all.map(p => p.role).filter(r => r !== undefined))

    /** Randomly assigns characters selected during setup */
    function setupAssignRandomly() {
        const roles = shuffleArray(setupSelected.value)

        for (let p = 0; p < players.count; p++) {
            players.setRole(p, roles[p]!.id)
        }
    }


    /**
     * Uses Fisher-Yates random shuffle for a somewhat acceptable shuffle
     * @param array The array to be shuffled
     * @returns Copy of the array, but shuffled
     */
    function shuffleArray<T>(array: T[]): T[] {
        const result = [...array]

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [result[i], result[j]] = [result[j]!, result[i]!]
        }

        return result
    } 


    return {
        edition,
        availableRoles,
        availableTeamRoles,
        assignedTeamRoles,
        division,

        calculateNightOrder,
        loadScenario,
        loadRole,
        loadTravellers,
        setupSelected,
        setupAssignRandomly,

        shuffleArray,
    }
})