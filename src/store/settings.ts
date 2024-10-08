import { defineStore } from "pinia"
import { ref } from "vue"

export const useSettingsStore = defineStore("settings", () => {

    const soundOn = ref(false)
    const soundVolume = ref(100)
    const departedMaxRange = ref(60)
    const arrivingMaxMinutes = ref(60)
    const prefileDepartureMaxMinutes = ref(60)
    const prefileMaxTardinessMinutes = ref(60)
    const bookingsMaxHours = ref(6)
    const cid = ref(0)

    function save() {
        localStorage.settings_soundOn = soundOn.value
        localStorage.settings_soundVolume = soundVolume.value
        localStorage.settings_departedMaxRange = departedMaxRange.value
        localStorage.settings_arrivingMaxMinutes = arrivingMaxMinutes.value
        localStorage.settings_prefileDepartureMaxMinutes = prefileDepartureMaxMinutes.value
        localStorage.settings_prefileMaxTardinessMinutes = prefileMaxTardinessMinutes.value
        localStorage.settings_bookingsMaxHours = bookingsMaxHours.value
        if (cid.value) localStorage.settings_cid = cid.value
        else delete localStorage.settings_cid
    }

    function load() {
        try {
            if ("settings_soundOn" in localStorage) soundOn.value = localStorage.settings_soundOn == "true"
            if ("settings_soundVolume" in localStorage) soundVolume.value = parseFloat(localStorage.settings_soundVolume)
            if ("settings_departedMaxRange" in localStorage) departedMaxRange.value = parseInt(localStorage.settings_departedMaxRange)
            if ("settings_arrivingMaxMinutes" in localStorage) arrivingMaxMinutes.value = parseInt(localStorage.settings_arrivingMaxMinutes)
            if ("settings_prefileDepartureMaxMinutes" in localStorage) prefileDepartureMaxMinutes.value = parseInt(localStorage.settings_prefileDepartureMaxMinutes)
            if ("settings_prefileMaxTardinessMinutes" in localStorage) prefileMaxTardinessMinutes.value = parseInt(localStorage.settings_prefileMaxTardinessMinutes)
            if ("settings_bookingsMaxHours" in localStorage) bookingsMaxHours.value = parseInt(localStorage.settings_bookingsMaxHours)
            if ("settings_cid" in localStorage) cid.value = parseInt(localStorage.settings_cid) || 0
        } catch (err: any) {
            console.error("Failed to load settings", err)
        }
    }
    load()

    return {
        soundOn,
        soundVolume,
        departedMaxRange,
        arrivingMaxMinutes,
        prefileDepartureMaxMinutes,
        prefileMaxTardinessMinutes,
        bookingsMaxHours,
        cid,
        save
    }
})
