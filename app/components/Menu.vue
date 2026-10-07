<template>
    <UHeader
        class="relative z-10"
        mode="slideover"
        :ui="{ container: 'px-4!', left: 'h-full' }">
        <template #toggle="{ toggle }">
            <UChip :show="ui.grimoire.temporary"
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
            <USwitch v-model="ui.hidden" class="mb-3">
                <template #label>
                    Hide Grimoire <UKbd>G</UKbd>
                </template>
            </USwitch>
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
                    Hide Grimoire <UKbd>G</UKbd>
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
    ModalTokenSelector,
    ModalTemporaryGrimoire,
    ModalDisplayInfo,
    ModalDemonBluffs,
    DialogInput,
    DialogSession,
    DialogConfirm,
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
const socket = useSocket();

const referenceSheet = overlay.create(ModalReferenceSheet)
const nightOrder = overlay.create(ModalNightOrder)
const gameSetup = overlay.create(ModalGameSetup)
const selectScenario = overlay.create(ModalSelectScenario)
const tokenSelector = overlay.create(ModalTokenSelector)
const displayInfo = overlay.create(ModalDisplayInfo)
const temporaryGrimoire = overlay.create(ModalTemporaryGrimoire)
const demonBluffs = overlay.create(ModalDemonBluffs)

const confirmDialog = overlay.create(DialogConfirm)
const sessionDialog = overlay.create(DialogSession)
const inputDialog = overlay.create(DialogInput)


const scenarioIsSelected = computed(() => game.availableRoles.length > 0)
const disabledItemCss = computed(() => scenarioIsSelected.value ? '' : 'opacity-50 cursor-not-allowed')


const items = computed<NavigationMenuItem[][]>(() => cleanMenu([[
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
], !socket.isHost ? [] : [
    {
        label: 'Storyteller Tools',
        class: 'text-info',
        defaultOpen: true,
        icon: 'material-symbols-book-2-outline',
        chip: ui.grimoire.temporary ? {
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
                class: `text-sky-300 ${disabledItemCss.value}`,
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
                class: `${disabledItemCss.value} text-(--traveller)`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => displayInfo.open()
            },
            {
                label: `${ui.grimoire.temporary ? '!' : ''} Temporary Grimoire`,
                description: `Allows non-persistent modifications`,
                class: `${disabledItemCss.value} text-(--traveller) ${ui.grimoire.temporary ? 'text-error' : ''}`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => temporaryGrimoire.open()
            },
            {
                label: 'Set demon bluffs',
                description: 'They probably need it',
                class: `${disabledItemCss.value} text-(--demon)`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => demonBluffs.open({ editable: true })
            },
            {
                label: 'Hand out roles & bluffs',
                description: '',
                class: `${disabledItemCss.value} text-(--minion)`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => syncRoleData()
            },
            {
                label: 'Add a player',
                description: (players.length >= MAX_PLAYERS ? 'Max players reached' : ''),
                class:       (players.length >= MAX_PLAYERS ? 'opacity-50 cursor-not-allowed' : ''),
                disabled:     players.length >= MAX_PLAYERS,
                onSelect: () => addPlayer(),
            },
            {
                label: 'Clear all player roles',
                class: `${disabledItemCss.value}`,
                disabled: !scenarioIsSelected.value,
                onSelect: () => players.list.forEach(p => (p.role = undefined))
            },
            {
                ...ui.grimoire.lastAction,
            }
        ],
    },
], [
    {
        label: 'Game',
        class: 'grid-cols-1',
        defaultOpen: true,
        slot: 'game' as const,
        children: [
            socket.id ? {} : {
                label: 'Connect to a game',
                icon: 'i-carbon-connection-signal',
                onSelect: () => sessionDialog.open({ create: false })
            },
            socket.id ? {} : {
                label: 'Host a game',
                icon: 'material-symbols-book-2-outline',
                onSelect: () => sessionDialog.open({ create: true })
            },
            !socket.id ?{} : {
                label: 'Leave game',
                icon: 'i-lucide-square-arrow-right-exit',
                onSelect: () => socket.disconnect()
            },
            {
                label: 'Load game',
                onSelect: () => {
                    game.loadScript("tb")
                    for (const p of Array(8).keys()) {
                        players.add((p + 1).toString())
                    }
                }
            },
            !socket.id ? {} : {
                label: `${players.list.filter(p => p.socketId).length} connected`,
                description: '',
                icon: 'i-wordpress-connection',
            },
            {
                description: 'Player role division',
                icon: 'i-lucide-file-text',
                slot: 'division' as const
            },
            {
                label: 'Demon bluffs',
                class: 'text-(--demon)',
                onSelect: () => demonBluffs.open({ editable: false })
            }
        ]
    }
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
]]))

/** This function removes any {} objects from the menu */
function cleanMenu(menu: NavigationMenuItem[][]){
    for (let group = 0; group < menu.length; group++) {
        menu[group] = menu[group]!.filter(item => Object.keys(item).length > 0);

        for (let item of menu[group]!) {
            if (item.children)
                item.children = item.children.filter(child => Object.keys(child).length > 0)
        }
    }

    return menu.filter(group => group.length > 0)
}

async function addPlayer() {
    if (players.length >= MAX_PLAYERS)
        return

    const input = inputDialog.open({ title: 'Input the player name', placeholder: 'Player name' })

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
        game.toggleModifier(type, (item as Role).id)
    }
}

async function syncRoleData() {
    const confirm = confirmDialog.open({
        title: 'Syncing roles & bluffs',
        text: 'Are you sure you want to sync the roles to the players?'
    })

    const yes = await confirm.result;
    console.log(yes)
    if (yes) {
        socket.syncDataToPlayers();
    }
}
</script>
