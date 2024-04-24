<template>
    <v-snackbar v-model="snackbar" timeout="10000" color="grey-darken-4" class="mb-3">
        <span v-html="snackbarText" :class="'text-body-1 text-' + snackbarColor" />

        <template v-slot:actions>
            <v-btn icon size="small" @click="snackbar = false"><v-icon>mdi-close</v-icon></v-btn>
        </template>
    </v-snackbar>
</template>

<script setup lang="ts">

import { useSettingsStore } from "@/store/settings"
import { ref, watch } from "vue"
import { Howl } from "howler"

const props = defineProps<{ id: string, callsigns: string[] }>()

const atcPopupSound = new Howl({ src: "/audio/notification.mp3" })

const settings = useSettingsStore()

const snackbar = ref(false)
const snackbarText = ref("")
const snackbarColor = ref("")

let lastAtc = undefined as string[] | undefined
let lastId = undefined as string | undefined

watch(props, () => {
    if (lastId != props.id) {
        lastId = props.id
        lastAtc = undefined
        return
    }
    setTimeout(() => {
        let popups = []
        let popoffs = []
        if (typeof lastAtc != "undefined") {
            for (const callsign of props.callsigns) {
                if (!lastAtc.includes(callsign)) popups.push(callsign)
            }
            for (const callsign of lastAtc) {
                if (!props.callsigns.includes(callsign)) popoffs.push(callsign)
            }
        }
        lastAtc = props.callsigns
        if (popups.length > 0 || popoffs.length > 0) {
            if (settings.soundOn) {
                atcPopupSound.volume(settings.soundVolume / 100)
                atcPopupSound.play()
            }
            snackbarText.value = ""
            if (popups.length > 0) snackbarText.value += `<b style='font-family: monospace'>${popups.join(", ")}</b> online. `
            if (popoffs.length > 0) snackbarText.value += `<b style='font-family: monospace'>${popoffs.join(", ")}</b> offline. `
            snackbarColor.value = "white"
            snackbar.value = true
        }
    }, 1500)
})

</script>
