
<template>
    <UModal v-if="djinn" :ui="{ content: 'max-w-screen-md', body: 'max-h-[600px]', footer: 'flex relative'}">
        <template #title>
            <ModalTitle
                icon="picon:genie"
                title="Jinxes"
                description="Setting things straight"/>
        </template>
        <template #body>
            <div class="grid grid-cols-[64px_64px_64px_1fr] justify-center items-center px-3">
                <!-- Title -->
                <NuxtImg :src="djinn.image" class="col-span-2" />
                <span class="col-span-2 md:hidden" />
                <div class="col-span-4 md:col-span-2 flex flex-col my-auto px-3">
                    <span class="font-bold text-highlighted text-lg">{{ djinn.name }}</span>
                    <span class="text-sm text-toned">{{ djinn.ability }}</span>
                    <span class="text-sm text-gray-500 mt-2">{{ djinn.flavor }}</span>
                </div>

                <!-- Separator -->
                <span class="col-span-4 border-b border-accented my-4 md:my-0" />

                <!-- Jinxes -->
                <template v-for="jinx of game.jinxes">
                    <span class="hidden md:block" />
                    <NuxtImg :src="game.availableRoles.find(r => r.id === jinx.role1)!.image" />
                    <NuxtImg :src="game.availableRoles.find(r => r.id === jinx.role2)!.image" />
                    <span class="col-span-2 md:hidden" />
                    <span class="text-toned col-span-4 md:col-span-1 mb-4 md:mb-0 mx-4">{{ jinx.reason }}</span>
                </template>
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

const game = useGame()
const djinn = computed(() => game.assignedFabled.find(f => f.id === 'djinn'))
</script>
