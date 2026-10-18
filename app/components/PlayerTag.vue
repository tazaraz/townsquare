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

        <template v-if="!ui.grimoire.temporary"  #content>
            <div class="flex flex-col gap-2 p-2">
                <UInput
                    :disabled="index !== socket.seatIndex && !socket.isHost"
                    v-model="name"
                    :color="name == '' ? 'error' : 'primary'"
                    @change="socket.isHost ? players.setName(index, name) : socket.requestRename(name)"/>
                <template v-if="socket.isHost">
                    <UAlert variant="outline">
                        <template #description>
                            <USwitch
                                label="Is alive"
                                :default-value="!(player.state & PlayerState.Alive)"
                                @change="players.setState(index, PlayerState.Dead)"/>
                            <USwitch
                                label="Can vote"
                                :default-value="!(player.state & PlayerState.Voteless)"
                                class="mt-2"
                                @change="players.setState(index, PlayerState.Voteless)"/>
                        </template>
                    </UAlert>
                    <UAlert variant="outline" color="info">
                        <template #description>
                            <div class="flex flex-col">
                                <!-- Warning if player has or has been nominated already -->
                                <span v-if="player.nominated.has || player.nominated.been || players.get(targetPlayer!)?.nominated.been"
                                    class="text-warning mb-1 max-w-[200px]">
                                    <template v-if="player.nominated.has || player.nominated.been">
                                        {{ player.name }} has already
                                        {{ !player.nominated.has && player.nominated.been ? 'been' : '' }}
                                        nominated{{ players.get(targetPlayer!)?.nominated.been ? ', and ' : '' }}
                                    </template>
                                    <template v-if="players.get(targetPlayer!)?.nominated.been">
                                        {{ players.get(targetPlayer!)?.name }} has already been nominated
                                    </template>
                                    today.
                                </span>

                                <span class="mb-1">Is nominating:</span>
                                <USelect
                                    v-model="targetPlayer"
                                    value-key="index"
                                    placeholder="select player"
                                    :items="players.list.map((p, i) => ({ label: p.name, index: i }))"
                                    :content="{ position: 'item-aligned' }"/>
                                <UButton v-if="targetPlayer !== undefined"
                                    label="Confirm"
                                    color="info"
                                    class="mt-2"
                                    @click="players.setNominated(targetPlayer, index, true)"/>
                            </div>
                        </template>
                    </UAlert>
                    <UButton
                        :label="ui.swapping == index ? 'Cancel swap' : 'Swap seats'"
                        variant="outline"
                        @click="(ui.swapping == index ? ui.swapping = -1 : ui.swapping = index); open=!open"/>
                    <UButton v-if="players.get(index)?.socketId"
                        color="error"
                        label="Kick player"
                        variant="subtle"
                        @click="players.kick(index); open=!open"/>
                    <UButton
                        color="error"
                        label="Remove seat"
                        variant="subtle"
                        @click="players.remove(index); open=!open"/>
                </template>
                <template v-else>
                    <UButton v-if="game.nomination.open &&
                                   !player.nominated.been && !players.get(socket.seatIndex)?.nominated.has"
                        label="Nominate"
                        variant="outline"
                        color="info"
                        @click="socket.requestNominate(index)"/>
                    <UButton v-else-if="game.nomination.open"
                        :label="players.get(socket.seatIndex)?.nominated.has ?
                            'You already nominated' : 'Already been nominated'"
                        variant="outline"
                        color="neutral"
                        disabled
                        @click="socket.requestNominate(index)"/>
                        label="Claim seat"
                        variant="outline"
                        @click="socket.requestClaim(index)"/>
                    <UButton v-else-if="index === socket.seatIndex"
                        label="Unclaim seat"
                        variant="outline"
                        @click="socket.requestUnclaim()"/>
                    <UButton v-else-if="index !== socket.seatIndex && player.socketId === undefined"
                        label="Unclaim current seat"
                        variant="outline"
                        color="warning"
                        @click="socket.requestUnclaim()"/>
                </template>
            </div>
        </template>
    </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
    index: number
    player: Player
}>()

const game = useGame()
const socket = useSocket()
const ui = useUI()
const players = usePlayers()

const open = ref(false)
const name = ref(`${props.player.name}`);
const targetPlayer = ref<number | undefined>(undefined)

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