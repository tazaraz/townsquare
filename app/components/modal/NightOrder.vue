<template>
    <UModal :ui="{ content: 'max-w-screen-sm', body: 'grid gap-15 grid-cols-2', footer: 'self-center gap-10' }">
        <template #title>
            <ModalTitle
                icon="material-symbols:format-list-numbered-rounded"
                :title="`${game.script?.name || 'Custom script'} Reference Sheet`"
                description="Reference sheet for the current script"/>
        </template>
        <template #body>
            <div class="night-order truncate">
                <h3>First night</h3>
                <div v-for="role in game.scriptNightOrder.firstNight"
                    :class="['character', role.team, 'left', 'border-e', 'text-right']">

                    <div class="role-info items-end my-auto me-2">
                        <h3>{{ role.name }}</h3>
                        <span class="text-neutral-500">{{ role.players.map(p => p.name).join(", ") }}&nbsp;</span>
                    </div>
                    <NuxtImg :src="role.image" />
                </div>
            </div>

            <div class="night-order truncate">
                <h3>Other nights</h3>
                <div v-for="role in game.scriptNightOrder.otherNights"
                    :class="['character', role.team, 'right', 'border-s']">

                    <NuxtImg :src="role.image" />
                    <div class="role-info my-auto ms-2">
                        <h3>{{ role.name }}</h3>
                        <span class="text-neutral-500">{{ role.players.map(p => p.name).join(", ") }}&nbsp;</span>
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton label="Close" color="neutral" @click="emit('close')"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
// Overflow on both sides is a design choice. None of the other things I tried were any better.
// Now at least there is symmetry.

const emit = defineEmits<{
    close: []
}>()

const game = useGame()
game.calculateNightOrder()

</script>

<style scoped lang="css">
.night-order {
    & > h3 {
        font-weight: bold;
        font-size: 130%;
        text-align: center;
        border-bottom: 2px solid var(--ui-color-neutral-500);
        margin-bottom: 1rem;
    }
    .character {
        display: flex;
        flex-direction: row;
        position: relative;

        img {
            width: 5vh;
        }

        .role-info {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            overflow: visible;

            h3, span {
                width: max-content;
                max-width: none;
                white-space: nowrap;
            }


            h3 {
                font-size: 110%;
            }
            span {
                height: line-height;
            }
        }


        &::before {
            content: "";
            position: absolute;
            z-index: -1;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
        &.right::before {
            background: linear-gradient(90deg, color-mix(in srgb, currentColor, transparent 77%) 0%, rgba(0,0,0,0) 30%);
        }
        &.left::before {
            background: linear-gradient(270deg, color-mix(in srgb, currentColor, transparent 77%) 0%, rgba(0,0,0,0) 30%);
        }

        &.townsfolk { color: var(--townsfolk); }
        &.outsider { color: var(--outsider); }
        &.minion { color: var(--minion); }
        &.demon { color: var(--demon); }
        &.traveller { color: var(--traveller); }
        & > * { color: white; }
    }
}
</style>