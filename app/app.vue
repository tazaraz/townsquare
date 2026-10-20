<template>
    <UApp :toaster="{ position: 'top-right', expand: false }">
        <ClientOnly>
            <UMain>
                <Welcome />

                <Seats ref="seats"
                    @edit-player="editPlayer"
                    @edit-reminder="editReminder" />
            </UMain>
            <Menu />
        </ClientOnly>
    </UApp>
</template>

<script setup lang="ts">
// github.com/ThePandemoniumInstitute/botc-release/
import { ModalTokenSelector, Seats } from '#components'

const seatsComponent = useTemplateRef<typeof Seats>('seats')

// Start the stores
useGamestate()
useGame()
const players = usePlayers()
const socket = useSocket()

onMounted(() => {
    socket.reconnect()
})

const overlay = useOverlay();
const tokenSelector = overlay.create(ModalTokenSelector)

async function editPlayer(player: number) {
    const selector = tokenSelector.open({
        kind: 'role',
        title: {
            icon: 'i-lucide-user',
            text: `Select a role for ${players.get(player)!.name}`,
        },
        playerName: players.get(player)!.name,
        canClear: true
    })

    const role = await selector.result as Role | "unset" | undefined
    if (role) {
        players.setRole(player, typeof role === 'string' ? "unset" : role.id)
    }
}

/**
 * Edits a reminder for a player. If the reminder is "unset", it will be removed from the player.
 * @param player Player index to edit the reminder for
 * @param index Index of the reminder. If undefined, it is a new reminder.
 */
async function editReminder(player: number, index: number | undefined) {
    const selection = tokenSelector.open({
        kind: 'reminder',
        title: {
            icon: 'i-lucide-bell',
            text: `Select a reminder for ${players.get(player)!.name}`,
            description: index !== undefined ? 'Edit the reminder' : 'Add a new reminder'
        },
        canClear: typeof index === 'number',
    })

    const reminder = await selection.result as Reminder | "unset" | undefined
    if (reminder) {
        if (reminder === "unset") {
            // If unset is returned, the popup
            players.removeReminder(player, index!)
        } else {
            // Set the reminder
            players.setReminder(player, reminder, index);
        }

        // Wait for the DOM to update before updating the wheel layout
        await nextTick()
        seatsComponent.value!.circle.updateCSS()        // Ensure reminders are small
        seatsComponent.value!.circle.updateOrder(true)  // Ensure seats have correct width and offset
    }
}

</script>

<style lang="css" scoped>

</style>

<style lang="css">
html, body {
    overflow: hidden;
}
</style>