
<template>
    <UModal :ui="{ content: 'max-w-screen-md', body: 'overflow-hidden flex', footer: 'flex relative'}">
        <template #title>
            <ModalTitle
                icon="material-symbols:help-outline"
                title="About this site"
                description="Credits 'n stuff"/>
        </template>
        <!-- The bluffs -->
        <template #body>
            <div class="grid gap-3">
                <UPageCard
                    title="Blood on the Clocktower"
                    description="This game is a trademark of Steven Medway and The Pandemonium Institute.">
                    <UButton variant="subtle" class="w-fit" to="https://bloodontheclocktower.com/">Website</UButton>
                </UPageCard>
                <UPageCard
                    title="Townsquare Github"
                    description="Should you be interested in the code">
                    <UButton variant="subtle" class="w-fit" to="https://github.com/tazaraz/townsquare">Github</UButton>
                </UPageCard>
                <UPageCard
                    title="Townsquare inspiration (also called Townsquare)"
                    description="Original inspiration for this site was taken from Townsquare, but that site does not support mobile. This way, you can play locally with friends without requiring a laptop on your lap.">
                    <div class="flex gap-2">
                        <UButton variant="subtle" to="https://clocktower.online/">Online version</UButton>
                        <UButton variant="subtle" to="https://github.com/bra1n/townsquare/">Github</UButton>
                    </div>
                </UPageCard>
                <UPageCard
                    title="Background"
                    description="Obligatory attribution for the background.">
                    <UButton variant="subtle" class="w-fit" to="https://www.vecteezy.com/vector-art/77164940-minimalist-village-line-art-illustration">Online version</UButton>
                </UPageCard>
            </div>
        </template>

        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        label="Close"
                        color="neutral"
                        @click="emit('close')"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    close: []
}>()
</script>