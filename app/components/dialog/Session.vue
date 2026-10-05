<template>
    <UModal
        :title="create ? 'Create a lobby' : 'Join a lobby'"
        :ui="{ body: 'flex justify-center'}">
        <template #body>
            <div class="flex flex-col gap-5 w-full">
                <div>
                    <UInput
                        v-model="townsquareId"
                        :color="invalidTownsquareId() ? 'error' : 'neutral'"
                        placeholder=""
                        :ui="{ root: 'w-full', base: 'peer' }"
                        @keydown.enter="emit('close', '')">

                        <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                            <span class="inline-flex bg-default px-1">Townsquare ID</span>
                        </label>
                    </UInput>
                    <span v-if="invalidTownsquareId()" class="text-error text-sm ms-3">
                        Allowed values: A-Z, a-z, - and _.
                    </span>
                </div>

                <UInput
                    v-model="password"
                    :color="invalidTownsquareId() ? 'error' : 'neutral'"
                    placeholder=""
                    :ui="{ root: 'w-full', base: 'peer' }"
                    @keydown.enter="emit('close', '')">

                    <label class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
                        <span class="inline-flex bg-default px-1">Password</span>
                    </label>
                </UInput>

                <UAlert v-if="error.text" :color="error.severity" variant="outline">
                    <template #description>
                        {{ error.text }}
                    </template>
                </UAlert>
            </div>
        </template>
        <template #footer>
            <ModalFooter>
                <template #center>
                    <UButton
                        :label="create ? 'Create lobby' : 'Join lobby'"
                        color="primary"
                        :disabled="townsquareId === '' || invalidTownsquareId() || password === ''"
                        loading-auto
                        @click="create ? createTownsquare() : joinTownsquare()" />
                    <UButton
                        label="Close"
                        color="neutral"
                        @click="emit('close')" />
                </template>
            </ModalFooter>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
    create: boolean
}>()

const emit = defineEmits<{
    close: [] | [ string ]
}>()

const socket = useSocket()

const townsquareId = ref('')
const password = ref('')

const error = ref({
    severity: 'info' as 'info' | 'error',
    text: ''
})

async function createTownsquare() {
    const result = await socket.create(townsquareId.value, password.value)
    if (result) {
        if (result.status === 400)
            error.value.severity = 'error'
        if (result.status === 403)
            error.value.severity = 'info'

        error.value.text = result.text
        return
    }

    emit('close')
}

async function joinTownsquare() {
    const result = await socket.connect(townsquareId.value, password.value)
    if (result) {
        if (result.status === 401)
            error.value.severity = 'error'
        if (result.status === 404)
            error.value.severity = 'info'

        error.value.text = result.text
        return
    }

    emit('close')
}

function invalidTownsquareId() {
    return townsquareId.value !== '' && !/^[A-Za-z0-9_-]+$/.test(townsquareId.value)
}

</script>