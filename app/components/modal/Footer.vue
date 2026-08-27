<template>
    <div class="left">
        <slot name="left"></slot>
    </div>
    <div class="center flex gap-10 ms-auto md:ms-0 md:sticky md:translate-x-[-50%]">
        <slot name="center"></slot>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="css">
.center {
    left: 50%;
}
</style>