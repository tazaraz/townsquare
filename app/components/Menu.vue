<template>
    <UHeader class="relative z-10" mode="slideover" :ui="{ 'left': 'h-full' }">
        <template #left>
            <NuxtLink class="h-full p-3" to="https://bloodontheclocktower.com/" target="_blank">
                <NuxtImg src="/sprites/ccc.png" class="h-full"></NuxtImg>
            </NuxtLink>
            <div class="flex flex-col text-sm">
                <span>A Townsquare and</span>
                <span>Digital Grimoire</span>
            </div>
        </template>

        <UNavigationMenu :items="items" />

        <template #right>
            <UColorModeButton />
        </template>

        <template #body>
            <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        </template>
    </UHeader>
</template>




<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { ModalReferenceSheet, ModalNightOrder, ModalScenarioSetup } from '#components'

const overlay = useOverlay();

const referenceSheet = overlay.create(ModalReferenceSheet)
const nightOrder = overlay.create(ModalNightOrder)
const scenarioSetup = overlay.create(ModalScenarioSetup)

const items = computed<NavigationMenuItem[]>(() => [
    {
        label: 'Reference sheet',
        onSelect: () => referenceSheet.open(),
        active: false
    },
    {
        label: 'Night order',
        onSelect: () => nightOrder.open(),
        active: false
    },
    {
        label: 'Setup Scenario',
        onSelect: () => scenarioSetup.open(),
        active: false
    },
])
</script>
