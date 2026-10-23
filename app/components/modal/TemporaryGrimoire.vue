<template>
    <UModal
        :ui="{ content: 'max-w-screen-md', body: 'overflow-hidden flex', footer: 'flex relative'}">
        <template #title>
            <ModalTitle
                :icon="ui.grimoire.temporary ? 'i-lucide-book-open' : 'material-symbols-book-2-outline'"
                title="Temporary grimoire"
                description="Edit the player names, seats, states and reminders"/>
        </template>
        <template #body>
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <span class="text-muted">
                        This feature allows you to edit the player <UKbd>names</UKbd>, <UKbd>seats</UKbd>, <UKbd>states</UKbd> and <UKbd>reminders</UKbd> (etc.), without actually permutating the game state. Disabling this feature resets the grimoire to the original state.

                        <div class="text-center text-xs text-warning-500 mt-2 mx-auto">
                            <b>Note:</b> If you reload while this is active, the temporary grimoire will become the new grimoire.
                        </div>
                    </span>

                    <UAlert
                        :color="ui.grimoire.temporary ? 'error' : 'neutral'"
                        variant="subtle"
                        class="w-fit mx-auto">
                        <template #description>
                            <USwitch
                                v-model:model-value="ui.grimoire.temporary"
                                @click="ui.toggleTemporaryGrimoire()"
                                label="Temporary grimoire"
                                description="Enable or disable this feature"
                                class="font-medium"/>
                        </template>
                    </UAlert>
                </div>

                <hr class="text-neutral-800">

                <div class="flex flex-wrap gap-6 mt-3 mx-auto px-5">
                    <UButton
                        label="Randomize seat order"
                        @click="randomizeSeats"/>
                    <USwitch
                        v-model="fixTravellers"
                        label="Fix travellers"
                        description="Keeps travelers in their seat" />
                </div>
            </div>
        </template>

        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        label="Show to:"
                        color="secondary"
                        :class="targetPlayer === undefined || ui.grimoire.temporary === false ? 'bg-gray-500!':''"
                        :disabled="targetPlayer === undefined || ui.grimoire.temporary === false"
                        @click="sendGrimoire"/>
                    <USelect
                        v-model="targetPlayer"
                        value-key="index"
                        placeholder="select player"
                        :items="players.list.map((p, i) => ({ label: p.name, index: i }))"
                        :content="{ position: 'item-aligned' }"/>
                </template>
                <template #right>
                    <UButton
                        label="Close"
                        color="neutral"
                        @click="emit('close')"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    close: []
}>()

const game = useGame()
const players = usePlayers();
const ui = useUI()
const socket = useSocket()

/** Where this message is going */
const targetPlayer = ref<number | undefined>(undefined)
/** Whether to keep travellers in their seat when randomizing */
const fixTravellers = ref(false)

function randomizeSeats() {
    // Shuffle the players, but keep travellers in their seat if fixTravellers is true
    const roles = game.shuffleArray(
        players.list
            .filter(player => !fixTravellers.value || player.role?.team !== "traveller")
            // Map (copy) because of pointer sharing.
            .map(player => ({ role: player.role, reminders: player.reminders}))
    )

    let index = 0

    for (const player of players.list) {
        if (!fixTravellers.value || player.role?.team !== "traveller") {
            player.reminders = roles[index]!.reminders
            player.role = roles[index++]!.role
        }
    }
}

function sendGrimoire() {
    socket.sendTo(players.get(targetPlayer.value!)!.socketId!, 'grimoire',
        players.list.map(p => ({
            name: p.name,
            role: p.role?.id,
            reminders: p.reminders,
            state: p.state,
        }))
    )
}

</script>