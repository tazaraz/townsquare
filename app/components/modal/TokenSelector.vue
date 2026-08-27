<template>
    <UModal
        :title="`Select the ${kind}` + (kind !== 'fabled' ? ` for ${playerName}` : '')"
        :ui="{ content: 'max-w-screen-lg', footer: 'flex relative'}"
    >
        <template #body>
            <UTabs id="tabs" v-model="activeTab"
                   :style="{ '--token-size': `${ui.tokenSize * 0.8}px` }"
                   :items="tabs"
                   :ui="{ list: `mb-3 ${kind == 'role' ? '' : 'hidden'}` }"
            >
                <template #edition>
                    <template v-for="item in items">
                        <Token v-if="(item as Role).team !== 'traveller'"
                            :class="[(item as Role).team || undefined]"
                            :data="item"
                            :kind="kind"
                            @click="emit('close', item)"/>
                    </template>
                </template>
                <template #travellers>
                    <template v-if="items.length > 0 && !showTravellers" v-for="item in items">
                        <Token v-if="(item as Role).team === 'traveller'"
                            :class="[(item as Role).team || undefined]"
                            :data="item"
                            :kind="kind"
                            @click="emit('close', item)"/>
                    </template>
                    <div v-else-if="items.length === 0 && !showTravellers" class="text-center">
                        There are no travellers in this edition.
                    </div>
                    <template v-else v-for="item in game.loadAllTravellers()">
                        <Token v-if="item.team === 'traveller'"
                            :class="[item.team]"
                            :data="item"
                            :kind="kind"
                            @click="emit('close', item)"/>
                    </template>
                </template>
            </UTabs>
        </template>
        <template #footer>
            <ModalFooter>
                <template #left v-if="activeTab === '1'">
                    <USwitch v-model="showTravellers" label="Show all Travellers"/>
                </template>
                <template #center>
                    <UButton v-if="canClear"
                             :label="clearButtonLabel"
                             color="error"
                             @click="emit('close', 'unset')" class="mx-auto"/>
                    <UButton label="Cancel"
                             color="neutral"
                             @click="emit('close', undefined)" class="mx-auto"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">

const emit = defineEmits<{
    close: [item: Role | Reminder | "unset" | undefined]
}>()

const gamestate = useGamestate()
const ui = useUI()
const game = useGame()

const props = defineProps<{
    kind: TokenKind
    canClear?: boolean
    playerName?: string
}>()

const items = computed((): (Role | Reminder)[] => {
    switch (props.kind) {
        case 'role':
            return gamestate.roles
        case 'fabled':
            return gamestate.fabled
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
        case 'reminder':
            return "Remove reminder"
    }
})

const activeTab = ref('0')
const showTravellers = ref(false)
const tabs = [
    {
        label: 'Edition roles',
        slot: 'edition'
    },
    {
        label: 'Travellers',
        slot: 'travellers'
    }
]

</script>

<style lang="css" scoped>
#tabs {
    /* data attribute data-token */
    &:deep([data-slot="content"]) {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.5rem;

        .token {
            width: var(--token-size);
            flex: 0 0 var(--token-size);

            &.townsfolk { box-shadow: 0 0 10px var(--townsfolk),0 0 10px var(--townsfolk); }
            &.outsider { box-shadow: 0 0 10px var(--outsider),0 0 10px var(--outsider); }
            &.minion { box-shadow: 0 0 10px var(--minion),0 0 10px var(--minion); }
            &.demon { box-shadow: 0 0 10px var(--demon),0 0 10px var(--demon); }
            &.traveller { box-shadow: 0 0 10px var(--traveller),0 0 10px var(--traveller); }
        }
    }
}
</style>