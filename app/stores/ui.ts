import { defineStore } from 'pinia';

export const useUI = defineStore('UI', () => {
    const uistate = useGamestate().ui

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
        uistate.lastAction.label = label
        uistate.lastAction.description = 'Last action';
        uistate.lastAction.onSelect = () => action()

        action();
    }

    return {
        ...uistate,

        centered,
        formatReminderText,
        runAction,
    }
})