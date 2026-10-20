
<template>
    <UModal :ui="{ content: 'max-w-screen-md', body: 'overflow-hidden flex', footer: 'flex relative'}">
        <template #title>
            <ModalTitle
                icon="arcticons:fake-gps-2"
                title="Demon bluffs"
                description="Fake roles for the demon"/>
        </template>
        <template #body>
            <div class="flex gap-3 h-[120px] mx-auto">
                <Token v-for="role, i in game.demonBluffs"
                    :data="role"
                    kind="role"
                    hide-leaves
                    @click="editable && editBluff(i)"/>
            </div>
        </template>

        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        label="Close"
                        color="neutral"
                        @click="emit('close')"/>
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ModalTokenSelector } from '#components';

const props = defineProps<{
    editable: boolean
}>()

const emit = defineEmits<{
    close: []
}>()

const game = useGame()

const overlay = useOverlay();

const tokenSelector = overlay.create(ModalTokenSelector)

async function editBluff(index: number) {
    const selector = tokenSelector.open({
        kind: 'role',
        title: {
            icon: 'arcticons:fake-gps-2',
            text: 'Select a demon bluff'
        },
        canClear: true,
        disabled: (Object.values(game.assignedTeamRoles) as Player[][])
                    .flat()
                    .map(p => p.role?.id)
                    .filter(id => id !== undefined),
    })

    const role = await selector.result as Role | "unset" | undefined
    if (role && role !== undefined) {
        game.setBluff(index, role === 'unset' ? undefined : role.id)
    }
}
</script>