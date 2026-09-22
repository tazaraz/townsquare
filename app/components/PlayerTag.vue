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
                <UInput v-model="name"
                        :color="name == '' ? 'error' : 'primary'"
                        @change="players.setName(index, name)"/>
                <USwitch label="Is alive"
                    :default-value="player.state === 'alive'"
                    @change="player.state = player.state === 'alive' ? 'dead' : 'alive'"/>
                <USwitch v-if="player.state !== 'alive'" label="Has a deathvote"
                    :default-value="player.state === 'dead'"
                    @change="player.state = player.state === 'dead' ? 'voteless' : 'dead'"/>
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