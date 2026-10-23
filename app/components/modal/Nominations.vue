<template>
    <UModal :ui="{ content: 'max-w-screen-md' }">
        <template #title>
            <ModalTitle
                icon="material-symbols:how-to-vote"
                title="Nominations"
                description="Someones' keeping track"/>
        </template>
        <template #body>
            <div v-if="socket.isHost" class="flex flex-col sm:flex-row gap-3">
                <div class="grow-1">
                    <USwitch
                        @click="game.setNominations(!game.nomination.open)"
                        v-model:model-value="game.nomination.open"
                        label="Allow players to nominate"
                        color="info"
                        :ui="{label: 'text-muted'}"
                        class="font-medium text-start mb-3" />
                    <UButton
                        @click="resetPlayerNominations"
                        label="Reset players' nomination ability"
                        color="info"
                        class="font-medium text-start"/>
                </div>
                <div class="w-auto sm:h-auto sm:w-px border-default w-full border-solid border-t sm:border-s"/>
                <USwitch
                    v-model="game.nomination.history.sync"
                    label="Show voting results to players"
                    color="info"
                    :ui="{label: 'text-muted'}"
                    class="grow-1 font-medium text-start"/>
            </div>

            <!-- The voting history -->
            <div class="max-h-[500px] overflow-y-auto mt-5">
                <div class="grid grid-cols-1 md:grid-cols-[auto_auto_1fr_auto_auto_auto]">
                    <!-- Header -->
                    <div class="header hidden md:block z-1 bg-default/80">Nominee</div>
                    <div class="header hidden md:block z-1 bg-default/80">Nominator</div>
                    <div class="header hidden md:block z-1 bg-default/80">Votes</div>
                    <div class="header hidden md:block z-1 bg-default/80">Majority</div>
                    <div class="header hidden md:block z-1 bg-default/80">Result</div>
                    <div class="header hidden md:flex z-1 bg-default/80 justify-center items-center">
                        <UIcon name="ic-baseline-access-time-filled" class="size-5" />
                    </div>
                    <!-- History -->
                    <template v-for="(h, i) of game.nomination.history.entries" :key="h.time">
                        <div class="col-span-full grid grid-cols-1 md:grid-cols-subgrid border-b border-accented/80"
                            :class="i % 2 === 0 ? 'bg-elevated' : ''" >
                            <!-- Nominee -->
                            <div class="grid grid-cols-[5.5rem_1fr] md:block px-2 py-1">
                                <span class="text-highlighted font-semibold md:hidden">Nominee</span>
                                <span>{{ h.nominee }}</span>
                            </div>

                            <USeparator v-if="h.type === 'cleared'" label="Cleared" class="flex col-span-1 md:col-span-4 px-2" />

                            <template v-else>
                                <!-- Nominator -->
                                <div class="grid grid-cols-[5.5rem_1fr] md:block px-2 py-1">
                                    <span class="text-highlighted font-semibold md:hidden">Nominator</span>
                                    <span>{{ h.nominator }}</span>
                                </div>

                                <!-- Votes -->
                                <template v-if="h.votes.length >= game.votesRequired">
                                    <div class="grid grid-cols-[5.5rem_1fr] md:block col-span-1 px-2 py-1 min-w-0">
                                        <span class="text-highlighted font-semibold md:hidden">Votes</span>
                                        <span class="break-words">{{ h.votes.join(', ') }}</span>
                                    </div>

                                    <!-- Majority -->
                                    <div class="grid grid-cols-[5.5rem_1fr] md:block col-span-1 px-2 py-1">
                                        <span class="text-highlighted font-semibold md:hidden">Majority</span>
                                        <span>{{ h.majority ? 'Yes' : 'No' }}</span>
                                    </div>
                                </template>

                                <USeparator v-else label="Forced" class="flex col-span-1 md:col-span-2 px-2" />

                                <!-- Result -->
                                <div class="grid grid-cols-[5.5rem_1fr] md:block col-span-1 px-2 py-1">
                                    <span class="text-highlighted font-semibold md:hidden">Result</span>
                                    <span>{{ h.type === 'execution' ? 'Execution' : 'Exile' }}</span>
                                </div>
                            </template>

                            <!-- Time -->
                            <div class="grid grid-cols-[5.5rem_1fr] md:block px-2 py-1">
                                <UIcon name="ic:baseline-access-time-filled" class="my-auto text-highlighted md:hidden" />
                                <span class="whitespace-nowrap">
                                    {{ new Date(h.time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) }}
                                </span>
                            </div>
                        </div>
                    </template>
                </div>
                <div v-if="game.nomination.history.entries.length === 0" class="text-muted text-center py-3">
                    No nominations have been made yet.
                </div>
            </div>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton label="Close" color="neutral" @click="emit('close')"/>
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
const players = usePlayers()
const socket = useSocket()

function resetPlayerNominations() {
    for (let i = 0; i < players.length; i++) {
        players.setNominated(i, i, false)
    }
}

</script>

<style lang="css" scoped>
.header {
    position: sticky;
    top: 0;
    border-top: 2px solid var(--ui-border-accented);
    border-bottom: 2px solid var(--ui-border-accented);
    padding: 0.25rem 0.5rem;
}
</style>