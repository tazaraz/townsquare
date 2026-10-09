<template>
    <UPageCard
        :orientation="script.image ? 'horizontal' : undefined"
        reverse
        class="m-2">
        <template #body>
            <h2  class="text-2xl text-pretty font-semibold text-highlighted">{{ script.name }}</h2>
            <div class="text-[15px] text-pretty text-muted mt-1 max-h-[145px] overflow-auto">
                {{ script.description }}
            </div>
            <div class="flex flex-col border-t pt-2 mt-2 border-muted">
                <span v-if="script.author">Author: {{ script.author }}</span>
                <span v-if="script.level">Level: {{ script.level }}</span>
            </div>
        </template>

        <NuxtImg v-if="script.image" :src="script.image" class="max-h-[350px] h-full mx-auto" />
        <template #footer>
            <UButton :label="script.button" @click="emit('selected')"/>
        </template>
    </UPageCard>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    selected: []
}>()

const props = defineProps<{
    script: {
        id: string;
        name: string;
        description: string;
        image: string;
        author: string;
        level: string;
        type: string;
        button: string;
        onSelect: () => void;
    }
}>()
</script>