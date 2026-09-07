import { defineStore } from 'pinia';

export const useUI = defineStore('UI', () => {
    const uistate = useGamestate().ui

    /** Whether the Seats are shown in a circle */
    const centered = computed(() => uistate.orientation.rendered === 'center')


    return {
        ...uistate,

        centered,
    }
})