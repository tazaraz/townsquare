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
            <div class="flex flex-col p-2">
                <UInput v-model="name" 
                        :color="name == '' ? 'error' : 'primary'"
                        @change="players.setName(index, name)"/>
            </div>
        </template>
    </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
    index: number
}>()

const ui = useUI()
const players = usePlayers()

const player = players.get(props.index)!
const name = ref(`${player.name}`);

function resetFields(open: boolean) {
    // If we just closed the popover, ignore
    if (!open) return
    
    name.value = `${player.name}`
}


</script>

<style lang="css" scoped>
.player-tag {
    padding: 2% 4%;
    justify-content: center;
}
</style>