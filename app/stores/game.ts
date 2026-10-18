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
    id: string
    name: string
    image: string
    team: Team
    players: Player[]
}

export const useGame = defineStore('game', () => {
    const gamestate = useGamestate()
    const players   = usePlayers()

    /** The script being played */
    const script = computed(() => gamestate.script);

    /** Contains all roles available at the moment */
    const availableRoles = computed(() => gamestate.roles);

    /** Contains all roles for each team. */
    const availableTeamRoles = computed<Teams<Role[]>>(() => {
        return {
            townsfolk:  gamestate.roles.filter(c => c.team === "townsfolk"),
            outsider:   gamestate.roles.filter(c => c.team === "outsider"),
            minion:     gamestate.roles.filter(c => c.team === "minion"),
            demon:      gamestate.roles.filter(c => c.team === "demon"),
            traveller:  gamestate.roles.filter(c => c.team === "traveller"),
        }
    })

    /** Contains all roles assigned to players */
    const assignedTeamRoles = computed<Teams<Player[]>>(() => {
        return {
            townsfolk:  players.list.filter(p => p.role?.team === "townsfolk"),
            outsider:   players.list.filter(p => p.role?.team === "outsider"),
            minion:     players.list.filter(p => p.role?.team === "minion"),
            demon:      players.list.filter(p => p.role?.team === "demon"),
            traveller:  players.list.filter(p => p.role?.team === "traveller"),
        }
    })

    /** Available Fabled roles */
    const availableFabled: Role[] = roleData.filter(r => r.team === 'fabled').map(r => loadRole(r.id)!)
    /** Which fabled are assigned */
    const assignedFabled = computed(() => gamestate.fabled)
    /** Available Loric roles */
    const availableLoric: Role[] = roleData.filter(r => r.team === 'loric').map(r => loadRole(r.id)!)
    /** Which loric are assigned */
    const assignedLoric = computed(() => gamestate.loric)
    /** The demon bluffs */
    const demonBluffs = computed(() => gamestate.demonBluffs)
    /** The current nomination session */
    const nomination = computed(() => gamestate.nomination)

    /**
     * What amount of players to have for each team
     */
    const division = computed<TeamDivision | null>(() => {
        // Count the number of active players
        let travellers = players.list.filter(p => p.role?.team === "traveller").length
        const divisionRuleIdx = players.length - travellers - 5

        // Make sure we have at least 5 players
        if (divisionRuleIdx < 0) return null;

        // Return the config associated with the amount of players
        return {
            ...gameData[Math.min(divisionRuleIdx, 10)]!,  // File better exist
            traveller: travellers
        }
    })

    /** Night order for the current script */
    const scriptNightOrder = ref({ firstNight: [] as NightOrder[], otherNights: [] as NightOrder[] })
    /** Night order for the current script, given the known current player roles */
    const knownNightOrder = ref({ firstNight: [] as NightOrder[], otherNights: [] as NightOrder[] })

    /** Calculate the night order */
    function calculateNightOrder() {
        function sortByNightOrder(roles: Role[], night: "firstNight" | "otherNight"): NightOrder[] {
            return nightorderData[night]
                // Map the role ids to the actual role objects
                .map(roleId => {
                    // Add the info tokens to the night order reference
                    if (roleId === 'minioninfo' || roleId === 'demoninfo') {
                        return {
                            id: roleId,
                            name: roleId === 'minioninfo' ? 'Minion Info' : 'Demon Info & Bluffs',
                            image: '/sprites/generic/evil.webp',
                            team: roleId === 'minioninfo' ? 'minion' : 'demon',
                            players: { all: [] }
                        } as unknown as Role
                    }

                    return roles.find(r => r.id === roleId)!
                })
                // Remove any roles that are not in the current game
                .filter(r => r !== undefined)
                // Filter out travellers not in play
                .filter(r => r.team !== 'traveller' ||
                             (r.team === 'traveller' && players.list.some(p => p.role?.id === r.id)))
                .map(c => {
                    return {
                        id: c.id,
                        name: c.name,
                        image: c.image,
                        team: c.team,
                        players: players.list.filter(p => p.role?.id === c.id)
                    }
                })
        };

        const firstNight = sortByNightOrder(gamestate.roles, "firstNight");
        let otherNights = sortByNightOrder(gamestate.roles, "otherNight");

        // General night order for the current script
        scriptNightOrder.value.firstNight = firstNight;
        scriptNightOrder.value.otherNights = otherNights;

        // Night order for the current script, given the known current player roles
        const presentRoleIds = players.list.map(p => p.role?.id).filter((r): r is string => r !== undefined)

        knownNightOrder.value.firstNight = firstNight.filter(r => presentRoleIds.includes(r.id) &&
                                                             r.id !== 'minioninfo' && r.id !== 'demoninfo')
        knownNightOrder.value.otherNights = otherNights.filter(r => presentRoleIds.includes(r.id) &&
                                                             r.id !== 'minioninfo' && r.id !== 'demoninfo')
    }

    /**
     * Loads a scenario from the editions or supplied data, and populates the game state with the roles and fabled roles of that edition
     * @param game Either an array of role ids (for custom scripts), or an edition id (for predefined scripts)
     */
    function loadScript(game: (ScriptJSON | string)[] | string) {
        // If our previous session was for a different townsquare, we need to reset the game state
        gamestate.reset('game')

        // If the game is a custom script, we will have an array of role ids
        if (Array.isArray(game)) {
            // Find the metadata
            const idx = game.findIndex(i => typeof i === 'object' && i.id === "_meta")
            const metadata = (idx !== -1 ? game.splice(idx, 1)[0] : undefined) as ScriptJSON | undefined
            if (metadata && metadata.name === undefined)
                throw new DataFormatError(`The scenario is missing the required name.`)

            // Map the rest to roles, filter out duplicates
            const roles = [...new Set(game.map(role => typeof role === "object" ? role.id : role) as string[])]
            gamestate.script = {
                id: "custom",
                name: metadata?.name ?? "Custom script",
                author: metadata?.author,
                roles
            }
        }

        // There is an actual object to load
        else {
            const raw = editionsData.find(e => e.id === game)
            if (!raw)
                throw new NotFoundError(`Edition ${game} not found in editions data`)

            gamestate.script = {
                id: raw.id,
                name: raw.name,
                author: raw.author,
                description: raw.description,
                level: raw.level as keyof Script['level'],
                roles: raw.roles,
            }
        }

        // Load the roles and fabled roles
        for (const charId of gamestate.script.roles) {
            // Get the role from the roles data
            let char = loadRole(charId);
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
    function loadRole(id: string): Role {
        const raw = roleData.find(c => c.id === id)
        if (!raw)
            throw new DataFormatError(`Could not find role '${id}'`)

        if (!validTeam(raw.team))
            throw new DataFormatError(`Invalid team for role ${raw.id}: ${raw.team}`)

        if (!validRoleEditionId(raw.edition))
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

    /**
     * Toggles a game modifier
     * @param type Type the ID belongs to
     * @param id Id to toggle
     */
    function toggleModifier(type: 'fabled' | 'loric', id: string): boolean {
        // Get the correct store data
        const available = type === 'fabled' ? availableFabled  : availableLoric
        const store     = type === 'fabled' ? gamestate.fabled : gamestate.loric

        // Get the actual character associated with this id
        const char = available.find(f => f.id == id)
        if (!char)
            return false;

        // Toggle
        const index = store.findIndex(f => f.id == char.id)
        if (index < 0)
            store.push(char)
        else
            store.splice(index, 1)

        return true;
    }

    /**
     * Sets a demon bluff
     * @param index Index of the bluff to set
     * @param role Role to set as the bluff, or `undefined` to clear the bluff
     */
    function setBluff(index: number, role: string | undefined): boolean {
        if (index < 0 && 3 < index) return false;
        try {
            demonBluffs.value[index] = role ? loadRole(role) : undefined
            return true
        } catch {
            return false
        }
    }

    /**
     * Whether it is possible to nominate players
     * @param open Nomination state
     */
    function setNominations(open: boolean) {
        gamestate.nomination.open = open
        gamestate.nomination.hand = -1
        gamestate.nomination.nominator = -1
        gamestate.nomination.nominee = -1
    }

    /**
     * Marks a player for execution, or unmarks them if `player` is `-1`
     * @param player The player to mark for execution. Set to `-1` to unset
     * @param votes How many votes this player received.
     * @returns
     */
    function setMarked(player: number, votes: number) {
        const p = players.get(player)

        if (p) {
            gamestate.nomination.nominator = -1
            gamestate.nomination.nominee = -1
        }
        gamestate.nomination.marked = p ? { player, votes } : undefined
    }

    /** Contains selected roles during setup */
    const setupSelected = ref<Role[]>(players.list.map(p => p.role).filter(r => r !== undefined))

    /** Randomly assigns characters selected during setup */
    function setupAssignRandomly() {
        const roles = shuffleArray(setupSelected.value.slice(0, MAX_ACTIVE_PLAYERS))

        for (let p = 0; p < players.length; p++) {
            players.setRole(p, roles[p]?.id)
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
        script,

        availableRoles,
        availableTeamRoles,
        assignedTeamRoles,
        availableFabled,
        assignedFabled,
        availableLoric,
        assignedLoric,

        demonBluffs,
        nomination,
        division,

        scriptNightOrder,
        knownNightOrder,
        calculateNightOrder,

        loadScript,
        loadRole,
        loadTravellers,

        toggleModifier,
        setBluff,
        setNominations,
        setMarked,

        setupSelected,
        setupAssignRandomly,

        shuffleArray,
    }
})