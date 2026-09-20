<template>
    <UModal
        :title="`Select the characters for the game`"
        :ui="{ content: 'max-w-screen-lg', footer: 'flex relative'}"
    >
        <template #body>
            <template v-if="game.division"
                      v-for="(team, name) of game.availableTeamRoles" :key="name">
                <div v-if="name !== 'traveller'"
                     :class="[name, 'team-list flex flex-col md:flex-row']"
                     :style="{ '--token-size': `${ui.tokenSize * 0.8}px` }">
                    <div class="name w-full md:w-12">
                        <div class="flex flex-col md:rotate-270">
                            <h3 class="px-6 border-b-2 md:border-0 mb-2 md:mb-0">{{ name }}</h3>
                            <div class="mx-auto px-2 border rounded-full">
                                {{ teamCount(name) }}
                                <span class="px-1">⁄</span>
                                {{ game.division![name] }}
                            </div>
                        </div>
                    </div>
                    <div class="w-full flex flex-wrap justify-center gap-3 py-2">
                        <Token v-for="item in team"
                            :class="[(item as Role).team || undefined, getRole(item.name) ? 'selected': '']"
                            :data="item"
                            kind="role"
                            :hideLeaves="true"
                            :warning="getRole(item.name)?.setup"
                            @click="toggleRole(item.name)">
                            <template #warning>
                                This role modifies the setup of the game in an unpredictable way.
                            </template>
                        </Token>
                    </div>
                </div>
            </template>
            <h3 v-else>
                You need more players to set up the roles (at least 5 players)
            </h3>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <div class="flex flex-nowrap gap-1">
                        <UButton
                            :label="`Randomly assign ${roleTotal} character${roleTotal == 1 ? '' : 's'}`"
                            color="neutral"
                            @click="ui.runAction('Reroll Assignment', game.setupAssignRandomly); emit('close')"/>
                        <Remark v-if="roleTotal < players.count || players.count >= MAX_ACTIVE_PLAYERS"
                            kind="info"
                            class="shuffle-warning w-[32px] p-1">
                            <template v-if="roleTotal < players.count">
                                {{ players.count }} players are present, but you only have selected {{ roleTotal }}. Only the first {{ roleTotal }} players will receive a role.
                            </template>
                            <hr v-if="roleTotal < players.count && players.count >= MAX_ACTIVE_PLAYERS" class="my-2">
                            <template v-if="players.count >= MAX_ACTIVE_PLAYERS">
                                Up to {{ MAX_ACTIVE_PLAYERS }} can be assigned. The leftovers will not be assigned.
                            </template>
                        </Remark>
                    </div>
                    <div class="flex flex-nowrap gap-1">
                        <UButton label="Shuffle roles" color="neutral" @click="shuffle()"/>
                        <Remark v-if="game.setupSelected.some(r => r.setup)" kind="warning" class="shuffle-warning w-[32px] p-1">
                            Shuffling does not account for roles which modify the game in an unpredictable way.
                        </Remark>
                    </div>
                </template>
                <template #right>
                    <UButton label="Close" color="neutral" @click="() => emit('close')"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">

const emit = defineEmits<{ close: [] }>()
const ui = useUI()
const game = useGame()
const players = usePlayers()

const roleTotal = computed(() => game.setupSelected.length);

/**
 * Toggles roles from the selected array
 * @param role `Role` to toggle
 */
function toggleRole(role: string) {
    // Check if the role exists
    const index = game.setupSelected.findIndex(r => r.name === role)

    if (index !== -1) {
        game.setupSelected.splice(index, 1)
    } else {
        // Find the associated role and store it
        game.setupSelected.push(
            game.availableRoles.find(r => r.name == role)!
        )
    }
}

/**
 * Gets a `Role`
 * @param role `Role` to get
 */
function getRole(role: string) {
    return game.setupSelected.find(r => r.name === role)
}

/**
 * Counts how many of a team is present
 * @param team Team
 */
function teamCount(team: Team) {
    return game.setupSelected.filter(role => role.team === team).length
}

/**
 * Shuffles the roles randomly, assigning exacly the amount of players per `Team` as dictated by game logic
 */
function shuffle() {
    game.setupSelected.length = 0

    // For each team, select randomly
    for (const team in game.availableTeamRoles) {
        const roles = game.availableTeamRoles[team as keyof typeof game.availableTeamRoles]
        const count = game.division![team as keyof typeof game.division]

        // Add to the existing selection
        game.setupSelected.push(
            ...game.shuffleArray(roles).slice(0, count)
        )
    }
}

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

    /* data attribute data-token */
    .token {
        width: var(--token-size);
        flex: 0 0 var(--token-size);

        &.selected {
            &.townsfolk { box-shadow: 0 0 10px var(--townsfolk),0 0 10px var(--townsfolk); }
            &.outsider { box-shadow: 0 0 10px var(--outsider),0 0 10px var(--outsider); }
            &.minion { box-shadow: 0 0 10px var(--minion),0 0 10px var(--minion); }
            &.demon { box-shadow: 0 0 10px var(--demon),0 0 10px var(--demon); }
            &.traveller { box-shadow: 0 0 10px var(--traveller),0 0 10px var(--traveller); }
        }
    }
}

</style>