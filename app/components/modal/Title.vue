<template>
    <div class="flex gap-3 my-3 h-[3rem]">
        <div v-if="icon" class="flex size-11 rounded-sm bg-accented border-1 border-(--color-gold-300)">
            <UIcon :name="icon" class="m-auto size-6 text-(--color-gold-300)"/>
        </div>
        <div class="flex-1 flex flex-col">
            <span class="font-bold text-xl">{{ title }}</span>
            <span v-if="description" class="invisible md:visible text-sm text-gray-500">{{ description }}</span>
        </div>
    </div>
    <!-- Bookmark icon -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 18"
        class="size-14 z-[-1] text-red-400 absolute top-0 right-[15%]">
        <path fill="currentColor" d="M0 0h14v18l-7-3-7 3z"/>
    </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
    icon: string
    title: string
    description?: string
}>();
</script>