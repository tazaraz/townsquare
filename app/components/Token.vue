<template>
    <div :class="['token', kind, 'rounded-full', ui.showNightOrder ? '' : 'overflow-hidden']">
        <!-- Token sprite -->
        <NuxtImg src="/sprites/token.png" :class="{background, hidden: ui.hidden, dead: !ui.hidden && state == 'dead'}" />
        <!-- Dead token -->
        <NuxtImg v-if="!ui.hidden && state == 'dead'" src="/sprites/token.png" class="background small" />

        <template v-if="!ui.hidden && data">
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

        <!-- Side leaves -->
        <template v-if="kind == 'role' && data && !ui.hidden && !hideNightOrder">
            <template v-if="ui.showNightOrder">
                <UPopover class="night-tooltip first-night"
                          mode="hover"
                          :content="{side: ui.centered ? 'left' : 'top'}"
                          :ui="{content: 'w-64 p-4'}"
                          enable-touch>
                    <UButton label="0" />

                    <template #content>
                        {{ ui.formatReminderText((data as Role).firstNightReminder) }}
                    </template>
                </UPopover>

                <UPopover class="night-tooltip other-night"
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
            <template v-else>
                <NuxtImg v-if="(data as Role).firstNightReminder !== ''" src="/sprites/leaf.png" class="leaf first-night" />
                <NuxtImg v-if="(data as Role).otherNightReminder !== ''" src="/sprites/leaf.png" class="leaf other-night" />

                <div class="leaf setup">
                    <NuxtImg v-for="i in (data as Role).reminders.length" :data-index="i" src="/sprites/leaf.png"/>
                </div>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
const ui = useUI();

const props = defineProps<{
    kind: TokenKind
    data?: Role | Reminder
    state?: PlayerState
    hideNightOrder?: boolean
}>()

let background = "/token.png"

</script>

<style lang="scss">
.token {
    user-select: none;
    position: relative;
    aspect-ratio: 1;

    border: 3px solid black;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    cursor: pointer;

    & > * {
        position: absolute;
        top: 0;
    }

    & .background {
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
        &.small {
            width: 60%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }

    /** All the items within the token */
    .role {
        width: 90%;
        aspect-ratio: 1;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
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

    .night-tooltip {
        border: 2px solid black;
        border-radius: 50%;
        line-height: 1;
        aspect-ratio: 1;
        background-clip: padding-box !important;

        &.first-night {
            top: 50%;
            left: 0;
            transform: translate(-50%, -50%);
            background: linear-gradient(180deg,#000,#1f65ff);
        }
        &.other-night {
            top: 50%;
            right: 0;
            transform: translate(+50%, -50%);
            background: linear-gradient(180deg,#000,#ce0100);
        }
    }

    .leaf {
        // Important, as it makes sure the leafs have a height at all.
        height: 40%;

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
        &.setup {
            left: 50%;
            transform: translate(-50%, -65%) rotate(0deg);
            display: inline-flex;

            img {
                display: block;

                &:nth-child(1) { transform: translate(-10%, -10%) rotate(-35deg); }
                &:nth-child(2) { transform: translate(0%, -12%) rotate(-20deg); }
                &:nth-child(3) { transform: translate(-30%, -10%) rotate(-35deg); }
            }
        }
    }
}
</style>