<template>
    <UModal
        :title="title ?? 'Title unset'"
        :ui="{ body: 'flex justify-center'}">
        <template #body>
            <UInput
                v-model="input"
                :color="input == '' ? 'error' : 'neutral'"
                :placeholder="placeholder"
                :ui="{ root: 'w-full' }"
                :style="`padding-left: ${0.45 * leading?.length! || 1}rem`"
                autofocus
                @keydown.enter="input !== '' && emit('close', input)">

                <template v-if="leading" #leading>
                    <p class="text-sm text-muted">{{ leading }}</p>
                </template>
            </UInput>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        label="Confirm"
                        color="primary"
                        :disabled="input === ''"
                        @click="emit('close', input)" />
                    <UButton
                        label="Close"
                        color="neutral"
                        @click="emit('close')" />
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: string
    placeholder: string
    value?: string | undefined
    leading?: string
}>()

const emit = defineEmits<{
    close: [] | [ string ]
}>()

const input = ref(`${props.value || ''}`)

watch(() => input.value, (newValue) => {
    if (props.leading && input.value.startsWith(props.leading)) {
        input.value = input.value.slice(props.leading.length)
    }
})
</script>