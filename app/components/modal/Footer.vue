<template>
    <!-- <div v-if="!$slots.left && !$slots.right" class="spacer flex-1"></div> -->
    <div v-if="!$slots.left" class="spacer flex-1 hidden lg:block"></div>
    <div v-else class="left flex gap-3 flex-1">
        <slot name="left"></slot>
    </div>

    <main :class="['flex gap-3', !$slots.left && !$slots.right ? 'mx-auto' : '']">
        <slot name="center"></slot>
    </main>

    <div v-if="!$slots.right" class="spacer flex-1 hidden lg:block"></div>
    <div v-else class="right flex flex-1 flex justify-end">
        <slot name="right"></slot>
    </div>
</template>
