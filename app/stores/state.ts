import { defineStore } from 'pinia';

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
    /** The available reminders */
    const reminders = reactive({
        /** Reminders of which only one can be present at a time */
        once: [] as Reminder[],

        /** Reminders which are always present. To add, add `remindersGlobal: string[]` attribute to a role */
        global: [
            { name: 'Good', image: '/sprites/generic/good.webp' },
            { name: 'Evil', image: '/sprites/generic/evil.webp' },
            /** Custom note `isCustom` is strictly `false` instead of `undefined` */
            { name: 'Custom note', image: '/sprites/generic/custom.webp', isCustom: false },
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