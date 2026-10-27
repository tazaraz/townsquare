<template>
    <UHeader
        class="relative z-10"
        mode="slideover"
        v-model:open="isOpen"
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
                viewportWrapper: 'absolute bottom-full top-auto start-0 flex w-full',
                viewport: 'origin-[bottom_center]'
            }">
            <!-- During time of coding, this is the only way to edit the items. #slot="{item}" does not work. -->
            <template #game-content="{ item }">
                <div class="isolate grid p-2 grid-cols-2 gap-2 text-sm">
                    <button v-for="child in ((item as any).children)"
                        :class="['rounded-md transition hover:bg-elevated/50 flex gap-2 ms-0 py-2 px-3',child.disabled]"
                        @click="!child.disabled && child.onSelect?.()">

                        <UIcon :name="child.icon" class="size-5 text-dimmed" />
                        <div v-if="child.toggle">
                            <USwitch v-if="child.toggle === 'flavour'"
                                v-model="ui.showFlavor"
                                :label="child.label"
                                :disabled="child.disabled !== undefined"
                                :ui="{label: 'text-muted'}"
                                :class="['font-medium text-start', child.class]"/>
                            <USwitch v-else-if="child.toggle === 'nightorder'"
                                v-model="ui.showNightOrder"
                                :label="child.label"
                                :disabled="child.disabled !== undefined"
                                :ui="{label: 'text-muted'}"
                                :class="['font-medium text-start', child.class]"/>
                        </div>
                        <div v-else-if="child.info">
                            <template v-for="i of child.info">
                                <span v-if="i" :class="`inline-flex gap-1 me-2 ${i.icon.class}`">
                                    <UIcon :name="i.icon.name" class="my-auto"/> {{ i.count }}
                                </span>
                            </template>
                        </div>
                        <div v-else class="text-start">
                            <span :class="['font-medium', child.color]">{{ child.label }}</span>
                            <span :class="['text-muted line-clamp-2']">{{ child.description }}</span>
                        </div>
                    </button>
                </div>
            </template>
            <template #modifier-label>
                <span v-if="game.assignedFabled.length > 0" class="text-(--fabled)">Fabled</span>
                <span v-if="game.assignedFabled.length > 0 && game.assignedLoric.length > 0" class="px-1"> ⁄ </span>
                <span v-if="game.assignedLoric.length > 0" class="text-(--loric)">Loric</span>
            </template>
            <template #modifier-content="{ item }">
                <div class="isolate grid p-2 grid-cols-2 gap-2 text-sm">
                    <button v-for="child in ((item as any).children)"
                        :class="['rounded-md transition hover:bg-elevated/50 flex gap-2 ms-0 py-2 px-3',child.disabled]"
                        @click="referenceSheet.open({ kind: child.team as 'fabled' | 'loric' })">

                        <NuxtImg :src="child.image" class="w-[64px] h-[64px]" />
                        <div>
                            <span :class="`font-medium text-(--${child.team})`">{{ child.name }}</span>
                            <span class="text-muted line-clamp-2">{{ child.ability }}</span>
                        </div>
                    </button>
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

                <template #info="{ item }">
                    <template v-for="i of (item as any).info">
                        <span v-if="i" :class="`inline-flex gap-1 me-2 ${i.icon.class}`">
                            <UIcon :name="i.icon.name" class="my-auto"/> {{ i.count }}
                        </span>
                    </template>
                </template>

                <template #flavour="{ item }">
                    <USwitch
                        v-model="ui.showFlavor"
                        :label="(item as any).label"
                        :ui="{label: 'text-muted'}"
                        :class="['font-medium text-start', (item as any).class]"/>
                </template>
                <template #night-order="{ item }">
                    <USwitch
                        @click="sidebarOpenModalWithClose"
                        v-model="ui.showNightOrder"
                        :label="(item as any).label"
                        :ui="{label: 'text-muted'}"
                        :class="['font-medium text-start', (item as any).class]"/>
                </template>

                <template #ui-orientation="{ item }">
                    Token orientation: <USelect v-model="ui.orientation.user" size="xs" :items="[
                        {label: 'Left', value: 'left'},
                        {label: 'Top', value: 'top'},
                        {label: 'Right', value: 'right'},
                        {label: 'Bottom', value: 'bottom'},
                    ]" @change="sidebarOpenModalWithClose"/>
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
    ModalSelectScript,
    ModalTokenSelector,
    ModalTemporaryGrimoire,
    ModalDisplayInfo,
    ModalDemonBluffs,
    DialogInput,
    DialogSession,
    DialogConfirm,
    ModalNominations,
    UKbd,
    ModalAbout,
} from '#components'

defineShortcuts({
    g: () => {
        ui.hidden = !ui.hidden
    },
    a: () => {
        if (socket.isHost && players.length < MAX_PLAYERS)
            addPlayer()
    }
})


const overlay = useOverlay();
const players = usePlayers();
const ui = useUI();
const game = useGame();
const socket = useSocket();

const referenceSheet = overlay.create(ModalReferenceSheet)
const nightOrder = overlay.create(ModalNightOrder)
const gameSetup = overlay.create(ModalGameSetup)
const selectScript = overlay.create(ModalSelectScript)
const tokenSelector = overlay.create(ModalTokenSelector)
const displayInfo = overlay.create(ModalDisplayInfo)
const temporaryGrimoire = overlay.create(ModalTemporaryGrimoire)
const demonBluffs = overlay.create(ModalDemonBluffs)
const nominations = overlay.create(ModalNominations)
const about = overlay.create(ModalAbout)

const confirmDialog = overlay.create(DialogConfirm)
const sessionDialog = overlay.create(DialogSession)
const inputDialog = overlay.create(DialogInput)


const isOpen = ref(false);
const scenarioIsSelected = computed(() => game.availableRoles.length > 0)


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
        class: 'text-primary',
        defaultOpen: true,
        icon: 'material-symbols-book-2-outline',
        chip: ui.grimoire.temporary ? {
            color: 'error',
            text: '!',
            size: 'xl'
        } : undefined,
        slot: 'storyteller' as const,
        children: [
            {
                label: 'Select script',
                class: 'text-sky-300',
                description: 'Define with what roles you are playing',
                onSelect: () => selectScript.open(),
            },
            {
                label: 'Game setup',
                description: 'Select roles and assign them to players.',
                class: `text-sky-300`,
                disabled: scenarioIsSelected.value ? undefined : 'opacity-50 cursor-not-allowed',
                onSelect: async () => { await gameSetup.open(); isOpen.value = !isOpen.value },
            },
            {
                label: 'Set demon bluffs',
                description: 'They probably need it',
                class: `text-(--demon)`,
                disabled: scenarioIsSelected.value ? undefined : 'opacity-50 cursor-not-allowed',
                onSelect: () => demonBluffs.open({ editable: true })
            },
            {
                label: 'Hand out roles & bluffs',
                description: '',
                class: `text-(--minion)`,
                disabled: scenarioIsSelected.value ? undefined : 'opacity-50 cursor-not-allowed',
                onSelect: () => syncRoleData()
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
                label: 'Communicate with a player',
                description: 'Either a token or text',
                disabled: scenarioIsSelected.value ? undefined : 'opacity-50 cursor-not-allowed',
                onSelect: () => sidebarOpenModalWithClose(displayInfo)
            },
            {
                label: `${ui.grimoire.temporary ? '!' : ''} Temporary Grimoire`,
                description: `Allows non-persistent modifications`,
                class: `${ui.grimoire.temporary ? 'text-error' : ''}`,
                disabled: scenarioIsSelected.value ? undefined : 'opacity-50 cursor-not-allowed',
                onSelect: () => sidebarOpenModalWithClose(temporaryGrimoire)
            },
            {
                label: 'Nominations',
                description: 'Allow player nominations',
                class: 'text-primary',
                disabled: scenarioIsSelected.value ? undefined : 'opacity-50 cursor-not-allowed',
                onSelect: () => sidebarOpenModalWithClose(nominations)
            },
            {
                icon: h(UKbd, { class: 'text-default! size-5' }, 'A'),
                label: players.length < MAX_PLAYERS ? 'Add a player' : 'Max players reached',
                class:       (players.length >= MAX_PLAYERS ? 'opacity-50 cursor-not-allowed' : ''),
                disabled:     players.length >= MAX_PLAYERS,
                onSelect: async () => addPlayer(),
            },
            {
                ...ui.grimoire.lastAction,
            }
        ],
    },
], [
    {
        label: 'Game',
        class: 'text-(--color-gold-600)',
        defaultOpen: true,
        icon: 'i-material-symbols-light-chess-pawn-rounded',
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
            !socket.id ? {} : {
                label: 'Leave game',
                icon: 'i-lucide-square-arrow-right-exit',
                onSelect: () => socket.disconnect()
            },
            {
                label: 'Load game',
                onSelect: () => {
                    game.loadScript("tb")
                    for (const p of Array(6).keys()) {
                        players.add((p + 1).toString())
                    }
                }
            },
            !socket.id ? {} : {
                label: `${players.list.filter(p => p.socketId).length} connected`,
                description: '',
                icon: 'i-wordpress-connection',
            },
            socket.seatIndex < 0 || game.nomination.history.entries.length === 0 ? {} : {
                label: 'Voting History',
                icon: 'material-symbols:how-to-vote',
                onSelect: () => sidebarOpenModalWithClose(nominations)
            },
            socket.isHost || socket.seatIndex < 0 ? {} : {
                label: 'Message storyteller',
                icon: 'i-material-symbols-chat-outline',
                onSelect: () => sidebarOpenModalWithClose(messageHost)
            },
            socket.isHost || socket.seatIndex < 0 ? {} : {
                label: 'Demon bluffs',
                class: 'text-(--demon)',
                onSelect: () => demonBluffs.open({ editable: false })
            },
            players.length < 6 ? {} : {
                info: [{
                        icon: { name: 'material-symbols-groups', class: 'text-success' },
                        count: players.length
                    }, {
                        icon: { name: 'mingcute-heartbeat-2-fill', class: 'text-error' },
                        count: players.list.filter(p => !(p.state & PlayerState.Dead)).length
                    }, {
                        icon: { name: 'material-symbols-how-to-vote', class: 'text-neutral' },
                        count: players.list.filter(p => !(p.state & PlayerState.Voteless)).length
                    }, {
                        icon: { name: 'material-symbols-person', class: 'text-(--townsfolk)' },
                        count: game.division!.townsfolk
                    }, {
                        icon: { name: 'material-symbols-person', class: 'text-(--outsider)' },
                        count: game.division!.outsider
                    }, {
                        icon: { name: 'material-symbols-person', class: 'text-(--minion)' },
                        count: game.division!.minion
                    }, {
                        icon: { name: 'material-symbols-person', class: 'text-(--demon)' },
                        count: game.division!.demon
                    },
                    game.division!.traveller === 0 ? undefined : {
                        icon: { name: 'material-symbols-person', class: 'text-(--traveller)' },
                        count: game.division!.traveller
                    }
                ],
                slot: 'info' as const,
                onSelect: () => referenceSheet.open({ kind: 'role' })
            },
            {
                toggle: 'flavour',
                label: 'Show flavour text',
                slot: 'flavour' as const
            },
            {
                label: 'Show night order',
                toggle: 'nightorder',
                slot: 'night-order' as const
            },
            {
                select: 'ui-orientation',
                slot: 'ui-orientation' as const
            },
            {
                label: 'About',
                icon: 'material-symbols:help-outline',
                onSelect: () => sidebarOpenModalWithClose(about)
            },
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

async function sidebarOpenModalWithClose(modal: any) {
    setTimeout(() => isOpen.value = !isOpen.value, 500)
    modal.open()
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
        title: {
            icon: 'boxicons:sparkles',
            text: type === 'fabled' ? 'Select a Fabled' : 'Select a Loric',
            description: 'Enforce your rule. Alter game mechanics.'
        },
        selected: (type === 'fabled' ? game.assignedFabled : game.assignedLoric).map(f => f.id),
    })

    const item = await selector.result;
    if (item) {
        game.toggleModifier(type, (item as Role).id)
    }
}

async function syncRoleData() {
    const confirm = confirmDialog.open({
        title: 'Syncing roles & bluffs',
        text: 'Are you sure you want to sync the roles and bluffs to the players?'
    })

    const yes = await confirm.result;
    if (yes) {
        socket.syncDataToPlayers();
    }
}

async function messageHost() {
    const input = inputDialog.open({ title: 'What do you want to say', placeholder: 'Message...' })

    const value = await input.result as string | undefined;
    if (value) {
        socket.sendTo('host', 'message', { text: value, buttons: 'dialog' } satisfies DirectMessage)
    }
}

</script>
