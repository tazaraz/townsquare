<template>
    <div :class="['token', kind, 'rounded-full']">
        <UPopover
            class="inside rounded-full overflow-hidden"
            mode="hover"
            :open-delay="500"
            :content="{side: ui.centered ? 'left' : 'top'}"
            :ui="{content: ['w-64 p-4', !hidden && (data as Role)?.ability ? '' : 'hidden' ]}"
            enable-touch>
            <div>
                <!-- Token sprite -->
                <NuxtImg src="/sprites/token.png" :class="{
                    background,
                    hidden: hidden,
                    dead: state && state !== 'alive'
                }" />
                <!-- Dead token -->
                <NuxtImg v-if="state == 'dead'" src="/sprites/token.png" :class="[
                    'background small',
                    hidden?'hidden':''
                ]" />

                <template v-if="!hidden && data">
                    <!-- Overflow hidden section -->
                    <template v-if="kind == 'role'">
                        <template v-if="!hideLeaves">
                            <template v-if="!ui.showNightOrder">
                                <NuxtImg v-if="(data as Role).firstNightReminder !== ''" src="/sprites/leaf.png" class="leaf first-night" />
                                <NuxtImg v-if="(data as Role).otherNightReminder !== ''" src="/sprites/leaf.png" class="leaf other-night" />
                            </template>

                            <div class="leaf top">
                                <template v-for="i in (data as Role).reminders.length">
                                    <NuxtImg :style="{
                                        // Range step with .25 in both directions. (length - 1) can be zero, so defaul to 0
                                        '--offset': ((i - 1) - ((data as Role).reminders.length - 1) / 2) * 0.5 || 0
                                    }" src="/sprites/leaf.png"/>
                                </template>
                            </div>

                        </template>

                        <NuxtImg v-if="(data as Role).setup" src="/sprites/maple.png" class="leaf setup" />
                    </template>

                    <!-- Role -->
                    <NuxtImg :src="data.image" class="role" placeholder="/sprites/custom.png"/>
                    <!-- Text -->
                    <svg viewBox="0 0 150 150" class="name">
                        <path id="curve" d="M 13 75 C 13 160, 138 160, 138 75" fill="transparent"/>
                        <text class="label" width="150" x="66.6%" text-anchor="middle">
                            <textPath xlink:href="#curve">{{ data.name }}</textPath>
                        </text>
                    </svg>
                </template>

                <!-- Swapping icon -->
                <div v-if="kind == 'role' && canSwap"
                    class="flex w-full h-full justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg"class="p-9" viewBox="0 0 24 24" >
                        <path stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M7 11L3 7m0 0l4-4M3 7h18m-4 14l4-4m0 0l-4-4m4 4H3"></path>
                    </svg>
                </div>
            </div>

            <template v-if="!hidden && (data as Role)?.ability" #content>
                {{ ui.formatReminderText((data as Role).ability) }}
            </template>
        </UPopover>
        <!-- Overflow shown section -->
        <div class="outside" v-if="kind == 'role' && data">
            <template v-if="!hidden && !hideLeaves && ui.showNightOrder">
                <UPopover v-if="(data as Role).firstNightReminder"
                    class="night-tooltip first-night"
                    mode="hover"
                    :content="{side: ui.centered ? 'left' : 'top'}"
                    :ui="{content: 'w-64 p-4'}"
                    enable-touch>
                    <UButton label="0" />

                    <template #content>
                        {{ ui.formatReminderText((data as Role).firstNightReminder) }}
                    </template>
                </UPopover>

                <UPopover v-if="(data as Role).otherNightReminder"
                    class="night-tooltip other-night"
                    mode="hover"
                    :content="{side: ui.centered ? 'right' : 'top'}"
                    :ui="{content: 'w-64 p-4'}"
                    enable-touch>
                    <UButton label="1"/>

                    <template #content>
                        {{ ui.formatReminderText((data as Role).otherNightReminder) }}
                    </template>
                </UPopover>
            </template>

            <Remark v-if="warning" kind="warning" class="rounded-full">
                <!-- Pass through data -->
                <slot name="warning"></slot>
            </Remark>
        </div>
    </div>
</template>

<script setup lang="ts">
const ui = useUI();

const props = defineProps<{
    kind: TokenKind
    data?: Role | Reminder
    state?: PlayerState
    hidden?: boolean

    hideLeaves?: boolean
    warning?: boolean
    canSwap?: boolean
}>()

const background = "/token.png"

</script>

<style scoped lang="scss">
.token {
    user-select: none;
    position: relative;
    aspect-ratio: 1;

    cursor: pointer;

    .inside > *,
    .outside > * {
        position: absolute;
    }

    border: 3px solid black;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    border-radius: calc(infinity * 1px);

    .inside {
        position: relative;
        height: 100%;
        width: 100%;

        .background {
            width: 100%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);

            &.hidden {
                display: inherit;
                filter: hue-rotate(225deg)
                        saturate(2.4)
                        brightness(0.55);
            }

            &.dead {
                filter: grayscale(100%)
                        brightness(0.66);
            }
            &.hidden.dead {
                filter: hue-rotate(225deg)
                        saturate(2.4)
                        grayscale(0.5)
                        brightness(0.3);
            }
            &.small {
                width: 60%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
        }

        /** All the items within the token */
        &.role {
            aspect-ratio: 1;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            overflow: hidden;
        }

        .name {
            .label {
                stroke: white;
                fill: black;
                font-size: 24px;
                stroke-width: 2px;
                paint-order: stroke;
                font-family: "Papyrus", serif;
                font-weight: bold;
                text-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
                letter-spacing: 1px;
            }
            &:hover .label {
                stroke: black;
                fill: white;
            }
        }

        .leaf {
            /* Important, as it makes sure the leafs have a height at all. */
            height: 30%;
            width: max-content;

            &.first-night {
                top: 50%;
                left: 0;
                transform: translate(-100%, -45%) rotate(240deg);
            }
            &.other-night {
                top: 50%;
                right: 0;
                transform: translate(+100%, -50%) rotate(80deg);
            }
            &.top {
                left: 50%;
                transform: translate(-50%, -65%) rotate(0deg);
                display: inline-flex;

                img {
                    display: block;
                    /* Dynamically position and angle the leaves based on a calculated offset */
                    transform:
                        translate(
                            calc(-10% +     (var(--offset) * 5%)),
                            calc(-5%  + abs((var(--offset) * 30%))),
                        )
                        rotate(
                            calc(-30deg +   (var(--offset) * 50deg))
                        )
                }
            }
            &.setup {
                height: 35%;
                bottom: 0;
                right: 0;
                transform: rotate(-15deg);
            }
        }
    }

    .outside {
        .night-tooltip {
            border: 2px solid black;
            border-radius: 50%;
            line-height: 1;
            aspect-ratio: 1;
            background-clip: padding-box !important;
            color: white;

            &.first-night {
                top: 50%;
                left: 0;
                transform: translate(-50%, -50%);
                background: linear-gradient(180deg,#000,var(--townsfolk));
            }
            &.other-night {
                top: 50%;
                right: 0;
                transform: translate(+50%, -50%);
                background: linear-gradient(180deg,#000,var(--demon));
            }
        }

        :deep(.info) {
            width: 30%;
            right: 0;
            top: 0;

            color: var(--minion);
            background: #21102f;
        }
    }
}
</style>