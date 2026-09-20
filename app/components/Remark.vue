<template>
    <!-- Info popover  -->
    <UPopover
        class="info"
        mode="hover"
        :content="{side: ui.centered ? 'right' : 'top'}"
        :ui="{content: 'w-64 p-4'}"
        enable-touch>
        <div>
            <svg v-if="kind == 'info'"
                viewBox="2.25 2.25 19.5 19.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7V7.01M12 10V17M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                stroke="var(--outsider)"/>
            </svg>
            <svg v-if="kind == 'warning'"
                viewBox="2.25 2.25 19.5 19.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16.99V17M12 7V14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                stroke="var(--minion)" />
            </svg>
        </div>

        <template #content>
            <slot></slot>
        </template>
    </UPopover>
</template>

<script setup lang="ts">
const ui = useUI()
const props = defineProps<{
    kind: 'info' | 'warning'
}>();

</script>

<style lang="css" scoped>
.info {
    aspect-ratio: 1;
}
</style>
