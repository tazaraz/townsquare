<template>
    <UModal
        :title="`${game.edition.name} Reference Sheet`"
        :ui="{
            content: 'max-w-screen-sm',
            body: 'grid gap-20 grid-cols-1 md:grid-cols-2',
            footer: 'self-center gap-10'
        }">
        <template #body>
            <div class="night-order text-right">
                <h3>First night</h3>
                <div v-for="role in game.scriptNightOrder.firstNight"
                    :class="['character', role.team, 'left', 'border-e']">

                    <div class="role-info my-auto me-2">
                        <h3>{{ role.name }}</h3>
                        <span class="text-neutral-500">{{ role.players.map(p => p.name).join(", ") }}&nbsp;</span>
                    </div>
                    <NuxtImg :src="role.image" />
                </div>
            </div>

            <div class="night-order">
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

const emit = defineEmits<{
    close: []
}>()

const game = useGame()

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
            flex: 1;
            flex-direction: column;
            justify-content: left;

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