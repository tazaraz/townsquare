<template>
    <UModal
        title="Define the temporary grimoire"
        :ui="{ content: 'max-w-screen-md', body: 'overflow-hidden flex', footer: 'flex relative'}">
        <template #body>
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-2">
                    <span class="text-muted">
                        This feature allows you to edit the player <UKbd>names</UKbd>, <UKbd>seats</UKbd>, <UKbd>states</UKbd> and <UKbd>reminders</UKbd> (etc.), without actually permutating the game state. <b>Note:</b> Disabling this feature resets the grimoire to the original state.
                    </span>

                    <UAlert
                        :color="ui.grimoire.temporary ? 'error' : 'neutral'"
                        variant="subtle"
                        class="w-fit mx-auto">
                        <template #description>
                            <USwitch
                                label="Temporary grimoire"
                                description="Enable or disable this feature"
                                :default-value="ui.grimoire.temporary"
                                @change="ui.toggleTemporaryGrimoire()"/>
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

const fixTravellers = ref(false)

function randomizeSeats() {
    if (!fixTravellers.value) {
        players.list.splice(0, players.list.length, ...game.shuffleArray(players.list))
        return
    }

    const shuffledNonTravellers = game.shuffleArray(
        players.list.filter(player => player.role?.team !== "traveller")
    )

    let index = 0

    for (let i = 0; i < players.list.length; i++) {
        if (players.list[i]!.role?.team !== "traveller") {
            players.list[i] = shuffledNonTravellers[index++]!
        }
    }

}
</script>