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
    /** Which edition we are playing */
    const edition: Ref<Edition> = ref({} as Edition)
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
    const isHost = ref(false)

    return {
        edition,
        roles,
        fabled,
        loric,
        players,
        demonBluffs,

        reminders,
        ui,
        sessionId,
        isHost,
    }
}, {
    // persist: {
    //     storage: sessionStorage
    // },
})