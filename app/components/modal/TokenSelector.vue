<template>
    <UModal
        :title="`Select a ${kind}` + (kind === 'role' ? ` for ${playerName}` : '')"
        :ui="{ content: 'max-w-screen-lg', footer: 'flex relative'}">
        <template #title>
            <ModalTitle :icon="title.icon" :title="title.text" :description="title.description"/>
        </template>
        <template #body>
            <UTabs
                id="token-kind"
                v-model="activeTab"
                :style="{ '--token-size': `${ui.tokenSize * 0.8}px` }"
                :items="tabs"
                :ui="{ list: `mb-3 ${kind == 'role' ? '' : 'hidden'}` }">
                <template #script>
                    <template v-for="item in items">
                        <Token v-if="(item as Role).team !== 'traveller'"
                            :class="[(item as Role).team || undefined, hasBackdrop((item as Role).id)]"
                            :data="item"
                            :kind="kind"
                            :hidden="isDisabled((item as Role).id)"
                            :hide-leaves="true"
                            @click="!isDisabled((item as Role).id) && emitToken(item)"/>
                    </template>
                </template>
                <template #travellers>
                    <template v-if="items.length > 0 && !showTravellers" v-for="item in items">
                        <Token v-if="(item as Role).team === 'traveller'"
                            :class="[(item as Role).team || undefined, hasBackdrop((item as Role).id)]"
                            :data="item"
                            :kind="kind"
                            :hidden="isDisabled((item as Role).id)"
                            :hide-leaves="true"
                            @click="!isDisabled((item as Role).id) && emitToken(item)"/>
                    </template>
                    <div v-else-if="items.length === 0 && !showTravellers" class="text-center">
                        There are no travellers in this script.
                    </div>
                    <template v-else v-for="item in game.loadTravellers()">
                        <Token v-if="item.team === 'traveller'"
                            :class="[item.team, hasBackdrop((item as Role).id)]"
                            :data="item"
                            :kind="kind"
                            :hidden="isDisabled((item as Role).id)"
                            :hide-leaves="true"
                            @click="!isDisabled((item as Role).id) && emitToken(item)"/>
                    </template>
                </template>
            </UTabs>
        </template>
        <template #footer>
            <ModalFooter>
                <template #left>
                    <UButton v-if="kind !== 'reminder'"
                        label="Reference sheet"
                        color="info"
                        @click="referenceSheet.open({ kind })"/>
                    <USwitch v-if="activeTab == '1'" v-model="showTravellers" label="Show all Travellers" class="py-2"/>
                </template>
                <template #center>
                    <UButton v-if="canClear"
                        :label="clearButtonLabel"
                        color="error"
                        @click="emit('close', 'unset')"/>
                    <UButton
                        label="Cancel"
                        color="neutral"
                        @click="emit('close', undefined)"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { DialogInput, ModalReferenceSheet } from '#components'

const emit = defineEmits<{
    close: [item: Role | Reminder | "unset" | undefined]
}>()

const gamestate = useGamestate()
const ui = useUI()
const game = useGame()

const referenceSheet = useOverlay().create(ModalReferenceSheet)
const inputDialog = useOverlay().create(DialogInput)

const props = defineProps<{
    kind: TokenKind
    title: { icon: string, text: string, description?: string }
    selected?: string[]
    disabled?: string[]
    canClear?: boolean
    playerName?: string
}>()

const items = computed((): (Role | Reminder)[] => {
    switch (props.kind) {
        case 'role':
            return gamestate.roles
        case 'fabled':
            return game.availableFabled
        case 'loric':
            return game.availableLoric
        case 'reminder':
            return gamestate.reminders.once.concat(gamestate.reminders.global)
    }
})

const clearButtonLabel = computed(() => {
    switch (props.kind) {
        case 'role':
            return "Clear role"
        case 'fabled':
            return "Remove fabled"
        case 'loric':
            return 'Remove Loric'
        case 'reminder':
            return "Remove reminder"
    }
})

const activeTab = ref('0')
const showTravellers = ref(false)
const tabs = [
    {
        label: 'Script roles',
        slot: 'script'
    },
    {
        label: 'Travellers',
        slot: 'travellers'
    }
]

function hasBackdrop(id: string): 'backdrop' | '' {
    if (props.selected === undefined)
        return 'backdrop'

    return props.selected.includes(id) ? 'backdrop' : ''
}

function isDisabled(id: string): boolean {
    if (props.disabled === undefined)
        return false;

    return props.disabled.includes(id)
}

async function emitToken(item: Role | Reminder | undefined) {
    // If the user clicked the custom note option, display an input. Only the custom note option is defined as false
    if ((item as Reminder)!.isCustom === false)
        item = await customReminder()

    // Make sure the item is valid
    if (item)
        emit('close', item)
}

async function customReminder() {
    const input = inputDialog.open({ title: 'Enter custom reminder', placeholder: 'Reminder text'})

    const value = await input.result as string | undefined;
    if (value) {
        return {
            name: value,
            image: '/sprites/generic/custom.webp',
            isCustom: true
        } as Reminder
    }
}

</script>

<style lang="css" scoped>
#token-kind {
    /* data attribute data-token */
    &:deep([data-slot="content"]) {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.5rem;

        .token {
            width: var(--token-size);
            flex: 0 0 var(--token-size);

            &.backdrop {
                &.townsfolk { box-shadow: 0 0 10px var(--townsfolk),0 0 10px var(--townsfolk); }
                &.outsider { box-shadow: 0 0 10px var(--outsider),0 0 10px var(--outsider); }
                &.minion { box-shadow: 0 0 10px var(--minion),0 0 10px var(--minion); }
                &.demon { box-shadow: 0 0 10px var(--demon),0 0 10px var(--demon); }
                &.traveller { box-shadow: 0 0 10px var(--traveller),0 0 10px var(--traveller); }
                &.fabled { box-shadow: 0 0 10px var(--fabled),0 0 10px var(--fabled); }
                &.loric { box-shadow: 0 0 10px var(--loric),0 0 10px var(--loric); }
            }
        }
    }
}
</style>