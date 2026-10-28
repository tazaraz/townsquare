<template>
    <!-- <div v-if="!$slots.left && !$slots.right" class="spacer flex-1"></div> -->
    <div v-if="!$slots.left" class="spacer flex-1 hidden lg:block"></div>
    <div v-else class="left flex flex-col md:flex-row gap-3 flex-1">
        <slot name="left"></slot>
    </div>

    <main
        class="flex flex-wrap gap-3"
        :class="[
            !$slots.left && !$slots.right ? 'mx-auto' : '',
            $slots.left && !$slots.right ? 'justify-end' : '',
            !$slots.left && $slots.right ? 'justify-start' : '',
        ]">
        <slot name="center"></slot>
    </main>

    <div v-if="!$slots.right" class="spacer flex-1 hidden lg:block"></div>
    <div v-else class="right flex flex-1 flex justify-end">
        <slot name="right"></slot>
    </div>
</template>
