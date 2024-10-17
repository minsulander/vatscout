<template>
    <v-container class="mt-5">
        <div class="text-h4 mb-5">Settings</div>
        <div class="mb-3 text-grey-darken-1">Settings are stored locally in the browser, i.e. they will not sync across devices.</div>
        <v-slider
            label="Notification sounds volume"
            v-model="settings.soundVolume"
            @end="endVolumeAdjustment"
            style="margin-left: 0"
        ></v-slider>
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    label="Departed max range"
                    suffix="nm"
                    variant="underlined"
                    v-model="settings.departedMaxRange"
                    @change="settings.save()"
                ></v-text-field>
                <v-text-field
                    label="Arriving max time (from now to ETA)"
                    suffix="HHMM"
                    variant="underlined"
                    v-model="arrivingMaxTime"
                    @change="settings.save()"
                ></v-text-field>
                <v-text-field
                    label="Prefile departure max time (from now to ETD)"
                    suffix="HHMM"
                    variant="underlined"
                    v-model="prefileDepartureMaxTime"
                    @change="settings.save()"
                ></v-text-field>
                <v-text-field
                    label="Prefile max tardiness (from filed ETD)"
                    suffix="HHMM"
                    variant="underlined"
                    v-model="prefileMaxTardinessTime"
                    @change="settings.save()"
                ></v-text-field>
                <v-text-field
                    label="Bookings max time"
                    suffix="hours"
                    variant="underlined"
                    v-model="settings.bookingsMaxHours"
                    @change="settings.save()"
                ></v-text-field>
                <v-text-field label="My VATSIM CID" variant="underlined" v-model="cid" @change="settings.save()"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-switch
                    label="Show unprimed controllers"
                    color="primary"
                    v-model="settings.showUnprimedControllers"
                    @change="settings.save()"
                    hide-details
                ></v-switch>
                <v-switch
                    label="Show turtle icon for slow IFR aircraft"
                    v-model="settings.showSlow"
                    @change="settings.save()"
                    hide-details
                ></v-switch>
                <v-switch
                    label="Show T1 for aircraft with PBN/T1 capability"
                    v-model="settings.showT1"
                    @change="settings.save()"
                    hide-details
                ></v-switch>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/store/settings"
import { minutes2hhmm, hhmm2minutes } from "@/common"
import { computed } from "vue"
import { Howl } from "howler"

const settings = useSettingsStore()

const arrivingMaxTime = computed({
    get() {
        return minutes2hhmm(settings.arrivingMaxMinutes)
    },
    set(value: string) {
        if (value.length == 4) settings.arrivingMaxMinutes = hhmm2minutes(value)
    },
})
const prefileDepartureMaxTime = computed({
    get() {
        return minutes2hhmm(settings.prefileDepartureMaxMinutes)
    },
    set(value: string) {
        if (value.length == 4) settings.prefileDepartureMaxMinutes = hhmm2minutes(value)
    },
})
const prefileMaxTardinessTime = computed({
    get() {
        return minutes2hhmm(settings.prefileMaxTardinessMinutes)
    },
    set(value: string) {
        if (value.length == 4) settings.prefileMaxTardinessMinutes = hhmm2minutes(value)
    },
})

const cid = computed({
    get() {
        return settings.cid > 0 ? "" + settings.cid : ""
    },
    set(value: string) {
        settings.cid = parseInt(value)
    },
})

const sound = new Howl({ src: "/audio/notification.mp3" })
function endVolumeAdjustment() {
    sound.volume(settings.soundVolume / 100)
    sound.play()
    settings.save()
}
</script>
