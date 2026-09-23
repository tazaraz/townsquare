<template>
    <UModal
        :title="title ?? 'Title unset'"
        :ui="{ body: 'flex justify-center'}">
        <template #body>
            <UInput
                v-model="value"
                :color="value == '' ? 'error' : 'neutral'"
                :placeholder="placeholder"
                :ui="{ root: 'w-full' }"
                :style="`padding-left: ${0.45 * leading?.length! || 1}rem`"
                autofocus
                @keydown.enter="value !== '' && emit('close', value)">

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
                        :disabled="value === ''"
                        @click="emit('close', value)" />
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

const value = ref(`${props.value || ''}`)
</script>