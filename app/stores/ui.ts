import { defineStore } from 'pinia';

export const useUI = defineStore('UI', () => {
    const uistate = useGamestate().ui
    const players = useGamestate().players

    /** Whether the Seats are shown in a circle */
    const centered = computed(() => uistate.orientation.rendered === 'center')

    function formatReminderText(reminder: string) {
        return reminder.replace(/\:reminder\:/g, '')
                       .replace(/\*(.*?)\*/g, (_, t) => `'${t.toLowerCase()}'`)
    }

    /**
     * Runs an action, one which you would like to display in the UI
     * @param label Name of the action
     * @param action Function associated with the action
     */
    function runAction(label: string, action: Function) {
        // Store the label
        uistate.grimoire.lastAction.label = label
        uistate.grimoire.lastAction.description = 'Last action';
        uistate.grimoire.lastAction.onSelect = () => action()

        action();
    }

    const oldGrimoire: Ref<Player[]> = ref([]);
    /**
     * Changes the grimoire to allow for non-persisting changes
     */
    function toggleTemporaryGrimoire() {
        uistate.grimoire.temporary = !uistate.grimoire.temporary
        if (uistate.grimoire.temporary) {
            // Copy old state
            oldGrimoire.value.splice(0, oldGrimoire.value.length, ...players)
            // Insert a temporary copy
            players.splice(0, players.length, ...structuredClone(toRaw(players)))
        } else {
            // Restore
            players.splice(0, players.length, ...oldGrimoire.value)
            oldGrimoire.value.length = 0
        }
    }

    return {
        ...toRefs(uistate),

        centered,
        formatReminderText,
        runAction,
        toggleTemporaryGrimoire
    }
})