<template>
    <UPageCard
        :orientation="scenario.image ? 'horizontal' : undefined"
        reverse
        class="m-2">
        <template #body>
            <h2  class="text-2xl text-pretty font-semibold text-highlighted">{{ scenario.name }}</h2>
            <div class="text-[15px] text-pretty text-muted mt-1 max-h-[145px] overflow-auto">
                {{ scenario.description }}
            </div>
            <div class="flex flex-col border-t pt-2 mt-2 border-muted">
                <span v-if="scenario.author">Author: {{ scenario.author }}</span>
                <span v-if="scenario.level">Level: {{ scenario.level }}</span>
            </div>
        </template>

        <NuxtImg v-if="scenario.image" :src="scenario.image" class="h-full mx-auto" />
        <template #footer>
            <UButton :label="scenario.button" @click="emit('selected')"/>
        </template>
    </UPageCard>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    selected: []
}>()

const props = defineProps<{
    scenario: {
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