<template>
    <!-- Show a welcome menu -->
    <div v-if="socket.isHost && welcomeSetupDone.length < 2" id="welcome-setup" class="z-2">
        <UAlert
            color="neutral"
            variant="subtle"
            :ui="{ root: 'text-center max-w-[550px] w-[90vw] text-start px-7'}">
            <template #description>
                <div class="text-center font-bold text-2xl m-3">Welcome!</div>
                <div class="text-lg">
                    Everything game or interface related can be found under <span class="inline-flex text-info"><UIcon name="material-symbols-light-chess-pawn-rounded" class="my-auto"/>Game</span>
                    and all of the host tools are available under <span class="inline-flex text-info"><UIcon name="material-symbols-book-2-outline" class="my-auto"/>Storyteller Tools</span>.
                </div>
                <USeparator class="my-2" />
                To set up a game, you need to do the following:
                <UCheckboxGroup v-model="welcomeSetupDone" class="m-2" :items="[
                    { label: 'Select a script', description: 'This defines the roles you play with', value: 'script' },
                    { label: 'Add players', description: 'Can\'t play this alone', value: 'players' },
                ]" />
                <UButton onclick="document.getElementById('welcome-setup').remove()"
                    class="flex mx-auto mt-6"
                    label="Close"/>
            </template>
        </UAlert>
    </div>
</template>

<script setup lang="ts">
const socket = useSocket()
const game = useGame()
const players = usePlayers()

const welcomeSetupDone = computed(() => [
    game.script !== undefined ? 'script' : '',
    players.length > 0 ? 'players' : '',
].filter(Boolean))
</script>

<style lang="css" scoped>
#welcome-setup {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}
</style>