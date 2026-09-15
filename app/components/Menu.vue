<template>
    <UHeader 
        class="relative z-10" 
        mode="slideover"
        :ui="{ container: 'px-4!', left: 'h-full' }" >
        <template #left>
            <NuxtLink class="h-full p-3 ps-0" to="https://bloodontheclocktower.com/" target="_blank">
                <NuxtImg src="/sprites/ccc.png" class="h-full"></NuxtImg>
            </NuxtLink>
            <div class="flex flex-col text-sm">
                <span>A Townsquare and</span>
                <span>Digital Grimoire</span>
            </div>
        </template>

        <UNavigationMenu :items="items" 
            :ui="{
                // Make sure the popover faces upward: it will not detect overflow.
                viewportWrapper: 'absolute bottom-full top-auto start-0 flex w-full justify-center',
                viewport: 'origin-[bottom_center]'
            }">
            <template #modifier-content="{ item }">
                <div class="isolate grid p-2 grid-cols-2 gap-2">
                    <div v-for="child in ((item as any).children as Role[])" 
                        class="flex text-sm text-left rounded-md p-3 transition-colors hover:bg-elevated/50"
                        @click="referenceSheet.open({ kind: child.team as any })">
                        <NuxtImg :src="child.image" class="w-[64px] h-[64px]" />
                        <div class="m-auto ms-2">
                            <span :class="`font-medium text-(--${child.team})`">{{ child.name }}</span>
                            <span class="text-muted line-clamp-2">{{ child.ability }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </UNavigationMenu>

        <template #body>
            <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5">
                <template #modifier-item="{ item }">
                    <div :class="`flex text-(--${(item as Role).name})`">
                        <NuxtImg :src="(item as Role).image" class="w-[32px] h-[32px]" />
                        <span class="m-auto ms-2">{{ (item as Role).name }}</span>
                    </div>
                </template>
            </UNavigationMenu>
        </template>

        <template #right>
            <USwitch class="hidden lg:flex">
                <template #label>
                    Show Grimoire <UKbd>G</UKbd>
                </template>
            </USwitch>
        </template>
    </UHeader>
</template>




<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { 
    ModalReferenceSheet, 
    ModalNightOrder, 
    ModalScenarioSetup,
    ModalInput,
    ModalTokenSelector,
} from '#components'

const overlay = useOverlay();
const players = usePlayers();
const ui = useUI();
const game = useGame();

const referenceSheet = overlay.create(ModalReferenceSheet)
const nightOrder = overlay.create(ModalNightOrder)
const scenarioSetup = overlay.create(ModalScenarioSetup)
const tokenSelector = overlay.create(ModalTokenSelector)
const inputModal = overlay.create(ModalInput)

const items = computed<NavigationMenuItem[][]>(() => [[
    {
        label: 'Reference sheet',
        onSelect: () => referenceSheet.open({ kind: 'role' }),
        active: false
    },
    {
        label: 'Night order',
        onSelect: () => nightOrder.open(),
        active: false
    },
], [
    {
        label: 'Storyteller Tools',
        class: 'text-secondary',
        defaultOpen: true,
        children: [
            {
                label: 'Select edition',
                description: 'Define with what roles you are playing',
                class: 'text-sky-300',
                onSelect: () => {},
            },
            {
                label: 'Game setup',
                description: 'Select roles and assign them to players.',
                class: 'text-sky-300',
                onSelect: () =>  scenarioSetup.open(),
            },
            {
                label: 'Add / Remove Fabled',
                description: 'Alter game mechanics',
                class: 'text-(--fabled)',
                onSelect: () => addModifier('fabled')
            },
            {
                label: 'Add / Remove Loric',
                description: 'Spice up yourself',
                class: 'text-(--loric)',
                onSelect: () => addModifier('loric')
            },
            {
                label: 'Display info',
                description: 'Either a token or text'
            },
            {
                label: 'Show Grimoire',
                description: 'Allows non-persistent modifications'
            },
            {
                label: 'Add a player',
                description: (players.count >= MAX_PLAYERS ? 'Max players reached' : ''),
                class:       (players.count >= MAX_PLAYERS ? 'text-neutral-700' : ''),
                onSelect: () => addPlayer(),
            },
            {
                label: 'Clear all player roles',
                onSelect: () => players.all.forEach(p => (p.role = undefined))
            },
            {
                ...ui.lastAction,
            }
        ],
    },
], [
    game.assignedFabled.length == 0 ? {} : {
        slot: 'modifier' as const,
        label: 'Fabled',
        class: 'text-(--fabled)',
        defaultOpen: true,
        children: game.assignedFabled.map(f => ({
            slot: 'modifier-item' as const,
            onSelect: () => referenceSheet.open({ kind: 'fabled' }),
            ...f,
        }))
    },
    game.assignedLoric.length == 0 ? {} : {
        slot: 'modifier' as const,
        label: 'Loric',
        class: 'text-(--loric)',
        defaultOpen: true,
        children: game.assignedLoric.map(f => ({
            slot: 'modifier-item' as const,
            onSelect: () => referenceSheet.open({ kind: 'loric' }),
            ...f,
        }))
    }
]])

async function addPlayer() {
    if (players.count >= MAX_PLAYERS)
        return

    const input = inputModal.open({ title: 'Input the player name', value: ''})

    const value = await input.result as string | undefined;
    if (value) {
        players.add(value);
    }
}

async function addModifier(type: 'fabled' | 'loric') {
    const selector = tokenSelector.open({ 
        kind: type, 
        selected: (type === 'fabled' ? game.assignedFabled : game.assignedLoric).map(f => f.id) 
    })

    const item = await selector.result;
    if (item) {
        if (type == 'fabled')
            game.toggleFabled((item as Role).name)
        else 
            game.toggleLoric((item as Role).name)
    }
}
</script>
