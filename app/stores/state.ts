import { defineStore } from 'pinia';

/** Maximum amount of players the game can accept */
export const MAX_PLAYERS = 20;
/** Maximum amount of active players (so excluding travellers) */
export const MAX_ACTIVE_PLAYERS = 15;

/**
 * This represents the game state, and is the only source of truth.
 * However, you probably should be using one other wrapper stores instead.
 */
export const useGamestate = defineStore('gamestate', () => {
    /** Which script we are playing */
    const script: Ref<Script | undefined> = ref(undefined)
    /** The roles and their definitions */
    const roles: Ref<Role[]> = ref([])
    /** Fabled roles */
    const fabled: Ref<Role[]> = ref([])
    /** Loric roles */
    const loric: Ref<Role[]> = ref([])
    /** The players */
    const players: Ref<Player[]> = ref([])
    /** The demon bluffs available to the demon */
    const demonBluffs: Ref<(Role | undefined)[]> = ref([undefined, undefined, undefined])
    /** The available reminders */
    const reminders = reactive({
        /** Reminders of which only one can be present at a time */
        once: [] as Reminder[],
        /** Reminders which are always present. To add, add `remindersGlobal: string[]` attribute to a role */
        global: [] as Reminder[],
    })

    const nomination = reactive<Nomination>({
        open: false,
        marked: undefined,

        nominator: -1,
        nominee: -1,

        hand: -1,
        speed: 3,
    })

    /** State of the UI */
    const ui = reactive<UI>({
        hidden: false,
        showNightOrder: true,
        showFlavor: true,

        swapping: -1,
        tokenSize: 0,

        orientation: {
            user: 'left',
            rendered: 'left'
        },
        grimoire: {
            temporary: false,
            selectedToken: 0,
            lastAction: {} as any,
        }
    })

    /** To which online session we are linked */
    const sessionId = ref('')

    /** Whether we are the host */
    const isHost = ref(true)
    /** Our current seat as a player */
    const seatIndex = ref(-1)
    /** Our id in the socket */
    const id = ref('')

    /**
     * Resets the state of the game.
     * @param level `seats` clears the seats, `connection` resets socket data, `game` resets the game only
     */
    function reset(level: 'seats' | 'connection' | 'game') {
        // Clear the current data
        switch (level) {
            case 'seats':
                players.value.length = 0;
                break;
            case 'connection':
                id.value = '';
                sessionId.value = '';
                seatIndex.value = -1;
                break;
            case 'game':
                useReminders().reset()
                script.value = undefined
                roles.value.length = 0;
                fabled.value.length = 0;
                loric.value.length = 0;

                for (const player of players.value)
                    player.role = undefined
                break;
        }
    }

    return {
        script,
        roles,
        fabled,
        loric,
        players,
        demonBluffs,

        reminders,
        nomination,
        ui,
        sessionId,
        isHost,
        seatIndex,
        id,

        reset,
    }
}, {
    persist: {
        storage: piniaPluginPersistedstate.localStorage(),
        debug: true,
    },

})