<template>
    <UModal
        :title="title ?? 'Title unset'"
        :ui="{ content: 'w-auto', body: 'flex justify-center'}">
        <template #body>
            <UInput v-model="value" 
                    :color="value == '' ? 'error' : 'neutral'" 
                    autofocus 
                    @keydown.enter="value !== '' && emit('close', value)"/>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton label="Confirm" 
                             color="primary" 
                             :disabled="value === ''" 
                             @click="emit('close', value)" />
                    <UButton label="Close" color="neutral" @click="emit('close')" />
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: string,
    value: string
}>()

const emit = defineEmits<{
    close: [] | [ string ]
}>()

const value = ref(`${props.value}`)
</script>