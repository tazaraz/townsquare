<template>
    <UModal :ui="{ content: 'max-w-screen-2xl', body: 'flex flex-col'}">
        <template #title>
            <ModalTitle
                icon="i-lucide-book-open"
                :title="`${tabs[Number(selected)]!.label} scripts`"
                description="Define the roles & mechanics"/>
        </template>
        <template #body>
            <UTabs v-model="selected"
                id="tabs"
                :items="tabs"
                :ui="{ content: 'flex flex-col gap-6 mb-3' }">
                <!-- List of official Pandemonium Institute scripts -->
                <template #core>
                    <template v-for="scenario in scripts">
                        <ModalSelectScriptCard
                            v-if="scenario.type === 'core'"
                            :script="scenario"
                            @selected="scenario.onSelect"/>
                    </template>
                </template>
                <!-- List of community scripts, 8+ players -->
                <template #full>
                    <NuxtImg src="/sprites/editions/custom.webp" class="max-h-[350px] h-full mx-auto" />
                    <template v-for="script in scripts">
                        <ModalSelectScriptCard
                            v-if="script.type === 'full'"
                            :script="script"
                            @selected="script.onSelect"/>
                    </template>
                </template>
                <!-- List of community scripts, <8 players a.k.a. teensyville -->
                <template #teensyville>
                    <NuxtImg src="/sprites/editions/custom.webp" class="max-h-[350px] h-full mx-auto" />
                    <template v-for="script in scripts">
                        <ModalSelectScriptCard
                            v-if="script.type === 'teensyville'"
                            :script="script"
                            @selected="script.onSelect"/>
                    </template>
                </template>
                <!-- Custom uploaded script -->
                <template #upload>
                    <UPageCard
                        orientation="horizontal"
                        reverse
                        class="m-2">
                        <template #body>
                            <h2  class="text-2xl text-pretty font-semibold text-highlighted">Load custom scenario</h2>
                            <div class="text-[15px] text-pretty text-muted my-1 max-h-[145px] overflow-auto">
                                Load your custom scenario here. You can upload custom scenarios or use ones defined by others.
                            </div>
                            <div v-if="script" class="flex flex-col border-t pt-2 mt-2 border-muted">
                                <span v-if="game.script?.author">Author: {{ game.script.author }}</span>
                                <span v-if="game.script?.level">Level: {{ game.script.level }}</span>
                            </div>
                            <UButton to="https://docs.google.com/document/d/1irgMUc-3QPR8QABV7uPClGzOJplkjt3YaR3t16jO_HY" target="_blank"
                                variant="outline" class="mt-2">
                                Click here for more scenarios (Google Docs)
                            </UButton>
                        </template>

                        <NuxtImg src="/sprites/editions/custom.webp" class="max-h-[350px] mx-auto" />

                        <!-- Upload options -->
                        <template #footer>
                            <div class="flex flex-wrap gap-2">
                                <UInput
                                    type="file"
                                    class="w-fit"
                                    accept=".json"
                                    @change="loadFile"/>
                                <div class="flex gap-2">
                                    <UButton
                                        label="Input file url"
                                        color="secondary"
                                        @click="getUrl"
                                        icon="i-formkit-url"/>
                                    <UButton
                                        label="Load from clipboard"
                                        color="secondary"
                                        @click="getClipboard"
                                        icon="i-lucide-clipboard"/>
                                </div>

                                <UAlert v-if="error"
                                    :title="error"
                                    color="error"
                                    variant="outline"
                                    :ui="{ root: 'mt-5 p-3' }"/>
                                <UAlert v-if="script && error === '' && game.availableRoles.length > 0"
                                    title="Loaded the following characters:"
                                    color="info"
                                    variant="outline"
                                    :ui="{ root: 'text-white mt-5 p-3', description: 'flex flex-wrap'}" >

                                    <!-- Show loaded roles -->
                                    <template #description>
                                        <template v-for="role, i in game.availableRoles">
                                            <span :class="`text-(--${role.team})`">{{ role.name }}</span>
                                            <template v-if="i < game.availableRoles.length - 1">,&nbsp;</template>
                                        </template>
                                    </template>
                                </UAlert>
                            </div>
                        </template>
                    </UPageCard>
                </template>
            </UTabs>
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
import { DialogInput } from '#components';
import editionData from '~/components/data/editions.json'

const game = useGame();

const overlay = useOverlay();
const inputDialog = overlay.create(DialogInput);

let script = null as any;

const emit = defineEmits<{
    close: []
}>()

const scripts = [
    ...editionData.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        image: s.type === 'core' ? `/sprites/editions/${s.id}.webp` : '',
        author: s.author,
        level: s.level,
        type: s.type,
        button: `Play ${s.name}`,
        onSelect: () => game.loadScript(s.id) && emit('close')
    }))
]

const selected = ref('0')
const tabs = [
    {
        label: 'Official',
        slot: 'core'
    },
    {
        label: 'Custom',
        slot: 'full'
    },
    {
        label: 'Teensyville',
        slot: 'teensyville'
    },
    {
        label: 'Upload',
        slot: 'upload'
    }
]

const error = ref(undefined as undefined | string)

async function getUrl() {
    const modal = inputDialog.open({
        title: 'Enter the url',
        placeholder: 'domain.com/path/to/scenario.json',
        leading: 'https://'
    })
    error.value = '';

    const url = await modal.result
    if (url) {
        let res: Response;
        try {
            res = await fetch(`https://${url}`);
            script = await res.json();
            game.loadScript(script);
        } catch (e) {
            if (e instanceof TypeError)
                error.value = 'Invalid url'
            else if (res!.status !== 200)
                error.value = 'File at the url does not exist';
            else
                error.value = e instanceof DataFormatError ? String(e) : 'Invalid JSON formatting'
            setTimeout(() => error.value = '', 5000)
        }
    }
}
async function loadFile(event: any) {
    const selectedFile = event.target!.files?.[0];
    error.value = '';

    if (!selectedFile)
        return;

    try {
        script = JSON.parse(await selectedFile.text());
        game.loadScript(script);
    } catch (e) {
        error.value = e instanceof DataFormatError ? String(e) : 'Invalid JSON formatting'
        setTimeout(() => error.value = '', 5000)
    }
}
async function getClipboard() {
    const text = await navigator.clipboard.readText();
    error.value = '';

    try {
        script = JSON.parse(text);
        game.loadScript(script);
    } catch (e) {
        error.value = e instanceof DataFormatError ? String(e) : 'Invalid JSON formatting'
        setTimeout(() => error.value = '', 5000)
    }
}
</script>