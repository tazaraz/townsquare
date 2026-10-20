<template>
    <UModal
        :ui="{ content: 'max-w-screen-lg', footer: 'flex relative'}">
        <template #title>
            <ModalTitle
                icon="material-symbols-chat-outline"
                title="Direct message"
                description="Send a message to a player"/>
        </template>
        <template #body>
            <div class="flex flex-col md:flex-row select-none">
                <div class="flex-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    <UButton v-for="option, t in texts"
                        class="cursor-pointer font-bold text-[110%]"
                        :color="index == t ? 'primary' : 'neutral'"
                        :variant="index == t ? 'solid' : 'outline'"
                        @click="index = t; requiredData = option.required">{{ option.label }}</UButton>
                    <UButton
                        class="cursor-pointer font-bold text-[110%]"
                        color="neutral"
                        variant="subtle"
                        @click="addCustom">Custom note</UButton>
                </div>
                <div v-if="socket.isHost && (requiredData === 'token' || requiredData === 'custom')"
                    class="flex-1 flex flex-col p-10 m-auto">
                    <Token
                        class="w-[120px] m-auto"
                        :data="roleToken"
                        :state="PlayerState.Alive"
                        kind="role"
                        :hide-leaves="true"
                        @click="editToken" />

                    <span v-if="!roleToken && requiredData !== 'custom'"
                        class="mt-5 mx-auto text-warning-500">You must set a role</span>
                    <span v-if="!roleToken && requiredData === 'custom'"
                        class="mt-5 mx-auto text-neutral-500">Leave empty to not send a role</span>
                </div>
                <div v-if="socket.isHost && ['select'].includes(requiredData)"
                    class="flex-1 flex flex-col p-10 m-auto">
                    <b v-if="!rolePlayers.length"
                        class="mb-2 mx-auto text-warning-500">You must select a player</b>
                    <span class="mb-2 mx-auto ">Selected player{{ rolePlayers.length == 1 ? '' : 's' }}:</span>

                    <USelect
                        class="m-auto"
                        v-model="rolePlayers"
                        value-key="index"
                        multiple
                        placeholder="Select a player"
                        :items="players.list.map((p, i) => ({ label: p.name, index: i }))"
                        :content="{ position: 'item-aligned' }"/>
                </div>
            </div>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        label="Show to:"
                        color="secondary"
                        :class="requiredData === 'token' && !roleToken ||
                                   requiredData === 'select' && rolePlayers.length === 0 ||
                                   targetPlayer === undefined ? 'bg-gray-500!':''"
                        :disabled="requiredData === 'token' && !roleToken ||
                                   requiredData === 'select' && rolePlayers.length === 0 ||
                                   targetPlayer === undefined"
                        @click="show"/>
                    <USelect
                        v-model="targetPlayer"
                        value-key="index"
                        placeholder="select player"
                        :items="players.list.map((p, i) => ({ label: p.name, index: i }))"
                        :content="{ position: 'item-aligned' }"/>
                </template>
                <template #right>
                    <UButton label="Close" color="neutral" @click="emit('close')"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { DialogInput, ModalTokenSelector } from '#components'

const emit = defineEmits<{
    close: []
}>()

const players = usePlayers()
const socket = useSocket()


const overlay = useOverlay();
const inputDialog = overlay.create(DialogInput)
const tokenSelector = overlay.create(ModalTokenSelector)


const requiredData = ref<'token' | 'select' | 'none' | 'custom'>('token')
const roleToken = ref<Role | undefined>(undefined)
const rolePlayers = ref<number[]>([])
/** Where this message is going */
const targetPlayer = ref<number | undefined>(undefined)
/** The selected text */
const index = ref<number>(4)


async function editToken() {
    const selector = tokenSelector.open({
        kind: 'role',
        title: {
            icon: 'material-symbols-person',
            text: 'Select a role to send',
            description: requiredData.value === 'custom' ? 'Clear it to not send a role' : ''
        },
        canClear: true
    })

    const selected = await selector.result as Role | "unset" | undefined
    if (selected && selected !== "unset") {
        roleToken.value = selected
    }
}

async function addCustom() {
    const input = inputDialog.open({ title: 'Write a custom note', placeholder: 'Custom note content' })

    const text = await input.result as string | undefined
    if (text) {
        texts.push({ label: text, required: 'custom', toastButtons: 'dialog' })
        index.value = texts.length - 1;
        requiredData.value = 'custom'
    }
}

function show() {
    socket.sendTo(players.get(targetPlayer.value!)!.socketId!, 'message', {
        text: texts[index.value]!.label
            + (texts[index.value]!.required === 'select'
                ? `: ${rolePlayers.value.map(i => players.get(i)!.name).join(', ')}`
                : ''),
        buttons: texts[index.value]!.toastButtons,
        role: texts[index.value]!.required === 'token' ? roleToken.value?.id : undefined,
    })
}

const texts: {
    label: string,
    required: typeof requiredData.value,
    toastButtons: DirectMessage['buttons'] }[] =
[
    { label: 'This is the Demon',           required: 'select', toastButtons: 'acknowledge'},
    { label: 'These are your Minions',      required: 'select', toastButtons: 'acknowledge'},
    { label: 'You are',                     required: 'token', toastButtons: 'acknowledge'},
    { label: 'This ability targeted you',   required: 'token', toastButtons: 'acknowledge'},
    { label: 'This player is',              required: 'token', toastButtons: 'acknowledge'},
    { label: 'You have this ability',       required: 'token', toastButtons: 'acknowledge'},
    { label: 'This character is in play',   required: 'token', toastButtons: 'acknowledge'},
    { label: 'Your choice',                 required: 'none', toastButtons: 'reply'},
    { label: 'Did you vote today?',         required: 'none', toastButtons: 'confirm'},
    { label: 'Use your ability now?',       required: 'none', toastButtons: 'confirm'},
    { label: 'Did you nominate today?',     required: 'none', toastButtons: 'confirm'},
]

</script>