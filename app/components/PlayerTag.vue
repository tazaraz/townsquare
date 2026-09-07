<template>
    <UPopover class="player-tag"
            mode="hover"
            arrow
            :content="{side: ui.centered ? 'left' : 'bottom'}"
            :ui="{content: ''}"
            enable-touch>
        <UButton :label="player.name" color="neutral" variant="subtle" />

        <template #content>
            <span class="size-48 inline-flex" />
            playertag
        </template>
    </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
    player: Player
}>()

const ui = useUI()

</script>

<style lang="css" scoped>
.player-tag {
    padding: 2% 4%;
    justify-content: center;
}
</style>