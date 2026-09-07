<template>
    <UModal
        :title="`${game.edition.name} Reference Sheet`"
        :ui="{ content: 'max-w-screen-2xl', footer: 'flex relative'}"
    >
        <template #body>
            <UTabs id="tabs"
                   :items="tabs"
                   :ui="{ content: `mb-3` }"
            >
                <template #scenario>
                    <template v-for="(team, name) of game.availableTeamRoles">
                        <div v-if="name !== 'traveller'"
                             :key="name"
                             :class="[name, 'team-list flex flex-col md:flex-row']">
                            <div class="name w-full md:w-6">
                                <h3 class="px-6 border-b-2 md:border-0 md:rotate-270">{{ name }}</h3>
                            </div>
                            <div class="flex-grow py-3 grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                                <div v-for="role in team" :key="role.id"
                                     class="role flex items-center">
                                    <NuxtImg :src="role.image"/>

                                    <div class="flex flex-col">
                                        <span class="font-bold" :style="{ color: `var(--${name})` }">{{ role.name }}</span>
                                        <span>{{ role.ability }}</span>
                                        <small v-if="ui.showFlavor" class="text-neutral-500">{{ role.flavor }}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
                <template #travellers>
                    <div class="traveller team-list flex flex-col md:flex-row">
                        <div class="name w-full md:w-6">
                            <h3 class="px-6 border-b-2 md:border-0 md:rotate-270">traveller</h3>
                        </div>
                        <div class="flex-grow py-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            <div v-for="role in game.availableTeamRoles.traveller" :key="role.id"
                                    class="role flex items-center">
                                <NuxtImg :src="role.image"/>

                                <div class="flex flex-col">
                                    <span class="font-bold" :style="{ color: `var(--traveller)` }">{{ role.name }}</span>
                                    <span>{{ role.ability }}</span>
                                    <small v-if="ui.showFlavor" class="text-neutral-500">{{ role.flavor }}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </UTabs>
        </template>
        <template #footer>
            <ModalFooter>
                <template #left>
                    <USwitch v-model="ui.showFlavor" label="Show character flavor text"/>
                </template>
                <template #center>
                    <UButton label="Close"
                            color="neutral"
                            @click="emit('close')" class="mx-auto"/>
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
const ui = useUI()

const tabs = [
    {
        label: 'Edition roles',
        slot: 'scenario'
    },
    {
        label: 'Travellers',
        slot: 'travellers'
    }
]

</script>

<style scoped lang="css">
.team-list {
    position: relative;
    border-left: 1px solid currentColor;

    .name {
        display: flex;
        align-items: center;
        justify-content: center;

        h3 {
            text-transform: uppercase;
            font-weight: bold;
        }
    }
    .role {
        display: flex;

        img {
            width: 8vh;
        }
    }
    border-top: 1px solid var(--ui-border);

    &::before {
        content: "";
        position: absolute;
        z-index: -1;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, color-mix(in srgb, currentColor, transparent 77%) 0%, rgba(0,0,0,0) 15%);
    }

    &.townsfolk { color: var(--townsfolk); }
    &.outsider { color: var(--outsider); }
    &.minion { color: var(--minion); }
    &.demon { color: var(--demon); }
    &.traveller { color: var(--traveller); }
    & > *:not(.name) { color: white; }

}
</style>