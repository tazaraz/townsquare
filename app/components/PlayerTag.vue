<template>
    <UPopover v-model:open="open"
            class="player-tag"
            mode="click"
            arrow
            :content="{side: ui.centered ? 'left' : 'bottom'}"
            :ui="{content: ''}"
            enable-touch
            @update:open="resetFields">
        <UButton color="neutral" variant="subtle">
            <UIcon v-if="player.socketId" name="material-symbols-person"/>{{ player.name }}
        </UButton>

        <template #content>
            <div class="flex flex-col gap-2 p-2">
                <UInput
                    :disabled="index !== socket.seatIndex && !socket.isHost"
                    v-model="name"
                    :color="name == '' ? 'error' : 'primary'"
                    @change="socket.isHost ? players.setName(index, name) : socket.requestRename(name)"/>
                <UAlert v-if="socket.isHost" variant="outline">
                    <template #description>
                        <USwitch
                            label="Is alive"
                            :default-value="player.state === 'alive'"
                            @change="players.setState(index, player.state === 'alive' ? 'dead' : 'alive')"/>
                        <USwitch v-if="player.state !== 'alive'"
                            label="Has a deathvote"
                            :default-value="player.state === 'dead'"
                            class="mt-2"
                            @change="players.setState(index, player.state === 'dead' ? 'voteless' : 'dead')"/>
                    </template>
                </UAlert>
                <UButton v-if="!socket.isHost && socket.seatIndex < 0"
                    label="Claim seat"
                    variant="outline"
                    @click="socket.requestClaim(index)"/>
                <UButton v-else-if="!socket.isHost && index === socket.seatIndex"
                    label="Unclaim seat"
                    variant="outline"
                    @click="socket.requestUnclaim()"/>
                <UButton v-else-if="!socket.isHost && index !== socket.seatIndex"
                    label="Unclaim current seat"
                    variant="outline"
                    @click="socket.requestUnclaim()"/>

                <UButton v-if="socket.isHost"
                    :label="ui.swapping == index ? 'Cancel swap' : 'Swap seats'"
                    variant="outline"
                    @click="(ui.swapping == index ? ui.swapping = -1 : ui.swapping = index); open=!open"/>
                <UButton v-if="socket.isHost"
                    color="error"
                    label="Remove player"
                    variant="outline"
                    @click="players.remove(index); open=!open"/>
            </div>
        </template>
    </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
    index: number
    player: Player
}>()

const socket = useSocket()
const ui = useUI()
const players = usePlayers()

const open = ref(false)
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