<template>
    <v-container class="mt-5">
        <v-slider label="Notification sounds volume" v-model="settings.soundVolume" @end="endVolumeAdjustment"></v-slider>
        <v-text-field label="Departed max range" suffix="nm" variant="underlined" v-model="settings.departedMaxRange" @change="settings.save()"></v-text-field>
        <v-text-field label="Arriving max time (from now to ETA)" suffix="HHMM" variant="underlined" v-model="arrivingMaxTime" @change="settings.save()"></v-text-field>
        <v-text-field label="Prefile departure max time (from now to ETD)" suffix="HHMM" variant="underlined" v-model="prefileDepartureMaxTime" @change="settings.save()"></v-text-field>
        <v-text-field label="Prefile max tardiness (from filed ETD)" suffix="HHMM" variant="underlined" v-model="prefileMaxTardinessTime" @change="settings.save()"></v-text-field>
        <v-text-field label="Bookings max time" suffix="hours" variant="underlined" v-model="settings.bookingsMaxHours" @change="settings.save()"></v-text-field>
    </v-container>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/store/settings"
import { computed } from "vue";
import { Howl } from "howler"
const settings = useSettingsStore()

const arrivingMaxTime = computed({
    get() { return minutes2hhmm(settings.arrivingMaxMinutes)},
    set(value: string) { if (value.length == 4) settings.arrivingMaxMinutes = hhmm2minutes(value)}
})
const prefileDepartureMaxTime = computed({
    get() { return minutes2hhmm(settings.prefileDepartureMaxMinutes)},
    set(value: string) { if (value.length == 4) settings.prefileDepartureMaxMinutes = hhmm2minutes(value)}
})
const prefileMaxTardinessTime = computed({
    get() { return minutes2hhmm(settings.prefileMaxTardinessMinutes)},
    set(value: string) { if (value.length == 4) settings.prefileMaxTardinessMinutes = hhmm2minutes(value)}
})

function minutes2hhmm(minutes: number) {
    const hours = Math.floor(minutes/60)
    const mins = minutes - hours*60
    return `${String(hours).padStart(2, "0")}${String(mins).padStart(2, "0")}`
}

function hhmm2minutes(hhmm: string) {
    const hours = parseInt(hhmm.substring(0,2))
    const minutes = parseInt(hhmm.substring(2,4))
    return hours*60+minutes
}

const sound = new Howl({ src: "/audio/notification.mp3" })
function endVolumeAdjustment() {
    sound.volume(settings.soundVolume / 100)
    sound.play()
    settings.save()
}
</script>
