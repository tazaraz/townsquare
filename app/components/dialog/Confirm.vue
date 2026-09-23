<template>
    <UModal
        :title="title ?? 'Title unset'"
        :ui="{ body: 'flex justify-center'}">
        <template #body>
            <slot></slot>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        label="No"
                        color="error"
                        @click="emit('close', false)" />
                    <UButton
                        label="Yes"
                        color="primary"
                        @click="emit('close', true)" />
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
    title: string
}>()

const emit = defineEmits<{
    close: [ boolean ]
}>()
</script>