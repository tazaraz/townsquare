import { defineStore } from 'pinia';

export const useUI = defineStore('UI', () => {
    const uistate = useGamestate().ui
    const players = useGamestate().players

    const toast = useToast()

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

    function showTemporaryGrimoire(grimoire: any) {
        const game = useGame()

        // Show the grimoire toast to the player
        toast.add({
            title: 'A raven is bringing you the storyteller\'s grimoire',
            description: 'Be careful, it cannot be unseen',
            icon: 'i-material-symbols-book-2-outline',
            color: 'info',
            close: false,
            actions: [{
                label: 'I am ready',
                color: 'info',
                onClick: () => {
                    toggleTemporaryGrimoire()

                    // Update the players to match the grimoire
                    players.splice(0, players.length, ...grimoire.map((p: any) => ({
                        name: p.name,
                        role: game.loadRole(p.role),
                        reminders: p.reminders,
                        state: p.state,
                    })))

                    // Add a notification allowing them to close the grimoire
                    toast.add({
                        title: 'You are viewing the storyteller\'s grimoire',
                        icon: 'i-material-symbols-book-2-outline',
                        color: 'error',
                        close: false,
                        actions: [{
                            label: 'I\'ve seen enough',
                            onClick: () => toggleTemporaryGrimoire()
                        }],
                        duration: 0,
                    })
                }
            }],
            duration: 0,
        })
    }

    return {
        ...toRefs(uistate),

        centered,
        formatReminderText,
        runAction,

        toggleTemporaryGrimoire,
        showTemporaryGrimoire,
    }
})