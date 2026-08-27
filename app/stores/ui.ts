import { defineStore } from 'pinia';

export const useUI = defineStore('UI', () => {
    const uistate = useGamestate().ui

    return {
        ...uistate,
    }
})