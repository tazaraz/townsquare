<template>
    <UModal
        :title="`Select the characters for the game`"
        :ui="{ content: 'max-w-screen-lg', footer: 'flex relative'}">
        <template #body>
            <div class="flex gap-3 justify-center mb-3">
                <USwitch v-model="useToken" label="Display token" />
            </div>
            <div class="flex flex-col md:flex-row select-none">
                <div class="flex-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    <UButton v-for="text, t in texts"
                        class="cursor-pointer font-bold text-[110%]"
                        :color="textIdx == t ? 'primary' : 'neutral'"
                        :variant="textIdx == t ? 'solid' : 'outline'"
                        @click="textIdx = t">{{ text }}</UButton>
                    <UButton
                        class="cursor-pointer font-bold text-[110%]"
                        color="neutral"
                        variant="subtle"
                        @click="addText">Custom note</UButton>
                </div>
                <div v-if="useToken" class="flex-1 flex m-10">
                    <Token
                        class="w-[120px] m-auto"
                        :data="token"
                        state="alive"
                        kind="role"
                        :hide-leaves="true"
                        @click="editToken" />
                </div>
            </div>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    Show to:
                    <!-- <USelect v-model="value" :items="items" /> -->
                    <UButton label="Show" color="neutral"/>
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

const overlay = useOverlay();
const inputDialog = overlay.create(DialogInput)
const tokenSelector = overlay.create(ModalTokenSelector)

const useToken = ref(true);
const textIdx = ref(4);
const token = ref(undefined as Role | undefined)

async function editToken() {
    const selector = tokenSelector.open({
        kind: 'role',
        canClear: true
    })

    const selected = await selector.result as Role | "unset" | undefined
    if (selected && selected !== "unset") {
        console.log(selected)
        token.value = selected
    }
}

async function addText() {
    const input = inputDialog.open({title: 'Write a custom note', placeholder: 'Custom note content'})

    const text = await input.result as string | undefined
    if (text) {
        texts.push(text)
        textIdx.value = texts.length - 1;
    }
}

const texts = [
    'This is the Demon',
    'These are your Minions',
    'You are',
    'This ability targeted you',
    'This player is',
    'You have this ability',
    'These characters are in play',
    'Your choice',
    'Did you vote today?',
    'Use your ability now?',
    'Did you nominate today?',
]

</script>