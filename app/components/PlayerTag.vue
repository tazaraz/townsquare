<template>
    <UPopover class="player-tag"
            mode="click"
            arrow
            :content="{side: ui.centered ? 'left' : 'bottom'}"
            :ui="{content: ''}"
            enable-touch
            @update:open="resetFields">
        <UButton :label="player.name" color="neutral" variant="subtle" />

        <template #content>
            <div class="flex flex-col gap-2 p-2">
                <UInput
                    v-model="name"
                    :color="name == '' ? 'error' : 'primary'"
                    @change="players.setName(index, name)"/>
                <UButton
                    :label="ui.swapping == index ? 'Cancel swap' : 'Swap seats'"
                    variant="outline"
                    @click="ui.swapping == index ? ui.swapping = -1 : ui.swapping = index"/>
            </div>
        </template>
    </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
    index: number
    player: Player
}>()

const ui = useUI()
const players = usePlayers()

const name = ref(`${props.player.name}`);

function resetFields(open: boolean) {
    // If we just closed the popover, ignore
    if (!open) return

    name.value = `${props.player.name}`
}


</script>

<style lang="css" scoped>
.player-tag {
    padding: 2% 4%;
    justify-content: center;
}
</style>