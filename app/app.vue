<template>
    <UApp>
        <UMain>
            <ClientOnly>
                <Seats ref="seats"
                    @edit-player="editPlayer"
                    @edit-reminder="editReminder"/>
            </ClientOnly>
        </UMain>
        <Menu />
    </UApp>
</template>

<script setup lang="ts">
// github.com/ThePandemoniumInstitute/botc-release/
import { ModalReferenceSheet, ModalTokenSelector, ModalNightOrder, Seats } from '#components'

const seatsComponent = useTemplateRef<typeof Seats>('seats')

console.log("DATA JSON VALIDATION TODO")
const game = useGame()
const players = usePlayers()

onBeforeMount(() => {
    game.loadScenario("tb")
    for (const p of Array(8).keys()) {
        players.add((p + 1).toString())
    }
    players.setRole(1, 'imp')
})


const overlay = useOverlay();
const tokenSelector = overlay.create(ModalTokenSelector)

async function editPlayer(player: number) {
    const selector = tokenSelector.open({
        kind: 'role',
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