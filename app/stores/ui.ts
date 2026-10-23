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

        // Clear the label after 15 seconds
        setTimeout(() => uistate.grimoire.lastAction = {} as any, 15000)

        action();
    }

    let notification: typeof toast.toasts.value[0]
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

            // The host can toggle this much easier, so we only show the notification for them
            if (useSocket().isHost) {
                notification = toast.add({
                    title: 'Temporary grimoire enabled',
                    icon: 'i-material-symbols-error-outline-rounded',
                    color: 'error',
                    close: false,
                    actions: [{
                        label: 'Disable',
                        onClick: () => toggleTemporaryGrimoire()
                    }],
                    duration: 0,
                })
            }
        } else {
            if (oldGrimoire.value.length === 0) {
                // Somebody reloaded while the grimoire was open, so we just reset the players to their current state
                players.splice(0, players.length, ...structuredClone(toRaw(players)))
            } else {
                // Restore
                players.splice(0, players.length, ...oldGrimoire.value)
                oldGrimoire.value.length = 0
            }

            toast.remove(notification?.id)
        }
    }

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
                    uistate.grimoire.temporary = false
                    toggleTemporaryGrimoire()

                    // Update the players to match the grimoire
                    players.splice(0, players.length, ...grimoire.map((p: any) => ({
                        name: p.name,
                        role: p.role ? game.loadRole(p.role) : undefined,
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