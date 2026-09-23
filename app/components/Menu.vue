<template>
    <UHeader
        class="relative z-10"
        mode="slideover"
        :ui="{ container: 'px-4!', left: 'h-full' }">
        <template #toggle="{ toggle }">
            <UChip :show="ui.temporaryGrimoire"
                text="!"
                color="error"
                size="3xl"
                class="lg:hidden">
                <UButton
                    icon="i-lucide-menu"
                    color="neutral"
                    variant="ghost"
                    class="lg:hidden"
                    @click="toggle" />
            </UChip>
        </template>
        <template #left>
            <NuxtLink class="h-full p-3 ps-0" to="https://bloodontheclocktower.com/" target="_blank">
                <NuxtImg src="/sprites/ccc.png" class="h-full"></NuxtImg>
            </NuxtLink>
            <div class="flex flex-col flex-nowrap text-sm">
                <span class="text-nowrap">A Townsquare and</span>
                <span class="text-nowrap">Digital Grimoire</span>
            </div>
        </template>

        <UNavigationMenu :items="items"
            :ui="{
                // Make sure the popover faces upward: it will not detect overflow.
                root: 'min-w-[400px]',
                viewportWrapper: 'absolute bottom-full top-auto start-0 flex w-full justify-center',
                viewport: 'origin-[bottom_center]'
            }">
            <template #modifier-label>
                <span v-if="game.assignedFabled.length > 0" class="text-(--fabled)">Fabled</span>
                <span v-if="game.assignedFabled.length > 0 && game.assignedLoric.length > 0" class="px-1"> ⁄ </span>
                <span v-if="game.assignedLoric.length > 0" class="text-(--loric)">Loric</span>
            </template>
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
                <template #modifier-label>
                    <span v-if="game.assignedFabled.length > 0" class="text-(--fabled)">Fabled</span>
                    <span v-if="game.assignedFabled.length > 0 && game.assignedLoric.length > 0" class="px-1"> ⁄ </span>
                    <span v-if="game.assignedLoric.length > 0" class="text-(--loric)">Loric</span>
                </template>
                <template #modifier-item="{ item }">
                    <div :class="`flex text-(--${(item as Role).name})`">
                        <NuxtImg :src="(item as Role).image" class="w-[32px] h-[32px]" />
                        <span class="m-auto ms-2">{{ (item as Role).name }}</span>
                    </div>
                </template>
            </UNavigationMenu>
        </template>

        <template #right>
            <USwitch v-model="ui.hidden" class="hidden lg:flex">
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
    ModalGameSetup,
    ModalSelectScenario,
    DialogInput,
    ModalTokenSelector,
    ModalTemporaryGrimoire,
    ModalDisplayInfo,
    ModalDemonBluffs,
} from '#components'

defineShortcuts({
    g: () => {
        ui.hidden = !ui.hidden
    },

})


const overlay = useOverlay();
const players = usePlayers();
const ui = useUI();
const game = useGame();

const referenceSheet = overlay.create(ModalReferenceSheet)
const nightOrder = overlay.create(ModalNightOrder)
const gameSetup = overlay.create(ModalGameSetup)
const selectScenario = overlay.create(ModalSelectScenario)
const tokenSelector = overlay.create(ModalTokenSelector)
const displayInfo = overlay.create(ModalDisplayInfo)
const temporaryGrimoire = overlay.create(ModalTemporaryGrimoire)
const demonBluffs = overlay.create(ModalDemonBluffs)

const inputDialog = overlay.create(DialogInput)


const scenarioIsSelected = computed(() => game.availableRoles.length > 0)
const disabledItemCss = computed(() => scenarioIsSelected.value ? '' : 'opacity-50 cursor-not-allowed')


const items = computed<NavigationMenuItem[][]>(() => [[
    !scenarioIsSelected.value ? {} : {
        label: 'Reference sheet',
        onSelect: () => referenceSheet.open({ kind: 'role' }),
        active: false
    },
    !scenarioIsSelected.value ? {} : {
        label: 'Night order',
        onSelect: () => nightOrder.open(),
        active: false
    },
], [
    {
        label: 'Storyteller Tools',
        class: 'text-info',
        defaultOpen: true,
        icon: 'material-symbols-book-2-outline',
        chip: ui.temporaryGrimoire ? {
            color: 'error',
            text: '!',
            size: 'xl'
        } : undefined,
        children: [
            {
                label: 'Select edition',
                description: 'Define with what roles you are playing',
                class: 'text-sky-300',
                onSelect: () => selectScenario.open(),
            },
            {
                label: 'Game setup',
                description: 'Select roles and assign them to players.',
                class: `text-sky-300 ${disabledItemCss}`,
                disabled: !scenarioIsSelected.value,
                onSelect: () =>  gameSetup.open(),
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
                description: 'Either a token or text',
                class: `${disabledItemCss} text-(--traveller)`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => displayInfo.open()
            },
            {
                label: `${ui.temporaryGrimoire ? '!' : ''} Temporary Grimoire`,
                description: `Allows non-persistent modifications`,
                class: `${disabledItemCss} text-(--traveller) ${ui.temporaryGrimoire ? 'text-error' : ''}`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => temporaryGrimoire.open()
            },
            {
                label: 'Set demon bluffs',
                description: 'They probably need it',
                class: 'text-(--demon)',
                onSelect: () => demonBluffs.open({ editable: true })
            },
            {
                label: 'Add a player',
                description: (players.count >= MAX_PLAYERS ? 'Max players reached' : ''),
                class:       (players.count >= MAX_PLAYERS ? 'opacity-50 cursor-not-allowed' : ''),
                disabled:     players.count >= MAX_PLAYERS,
                onSelect: () => addPlayer(),
            },
            {
                label: 'Clear all player roles',
                class: `${disabledItemCss}`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => players.list.forEach(p => (p.role = undefined))
            },
            {
                ...ui.lastAction,
            }
        ],
    },
], game.assignedFabled.length + game.assignedLoric.length == 0 ? [] : [
    {
        slot: 'modifier' as const,
        defaultOpen: true,
        children: [
            ...game.assignedFabled.map(f => ({
                slot: 'modifier-item' as const,
                onSelect: () => referenceSheet.open({ kind: 'fabled' }),
                ...f,
            })),
            ...game.assignedLoric.map(f => ({
                slot: 'modifier-item' as const,
                onSelect: () => referenceSheet.open({ kind: 'loric' }),
                ...f,
            }))
        ]
    },
]])

async function addPlayer() {
    if (players.count >= MAX_PLAYERS)
        return

    const input = inputDialog.open({ title: 'Input the player name', placeholder: 'Player name'})

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
