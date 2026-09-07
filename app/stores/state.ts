import { defineStore } from 'pinia';

/**
 * This represents the game state, and is the only source of truth.
 * However, you probably should be using one other wrapper stores instead.
 */
export const useGamestate = defineStore('gamestate', () => {
    /** Which edition we are playing */
    const edition = ref({} as Edition)
    /** The roles and their definitions */
    const roles = ref<Role[]>([])
    /** Fabled roles */
    const fabled = ref<Role[]>([])
    /** Loric roles */
    const loric = ref<Role[]>([])
    /** The players */
    const players = ref<Player[]>([])
    /** The available reminders */
    const reminders = reactive({
        /** Reminders of which only one can be present at a time */
        once: [] as Reminder[],

        /** Reminders which are always present. To add, add `remindersGlobal: string[]` attribute to a role */
        global: [
            { name: 'Good', image: '/sprites/generic/good.webp' },
            { name: 'Evil', image: '/sprites/generic/evil.webp' },
            { name: 'Custom note', image: '/sprites/generic/custom.webp' },
        ] as Reminder[],
    })

    /** State of the UI */
    const ui = reactive<UI>({
        hidden: false,
        selectedToken: 0,
        orientation: {
            user: 'left',
            rendered: 'left'
        },
        showNightOrder: true,
        showFlavor: true,

        tokenSize: 0,
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