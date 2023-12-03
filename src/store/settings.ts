import { defineStore } from "pinia"
import { ref } from "vue"

export const useSettingsStore = defineStore("settings", () => {

    const departedMaxRange = ref(150)
    const arrivingMaxMinutes = ref(120)
    const prefileDepartureMaxMinutes = ref(120)
    const prefileMaxTardinessMinutes = ref(60)
    const bookingsMaxHours = ref(6)

    function save() {
        console.log("save settings")
    }

    return {
        departedMaxRange,
        arrivingMaxMinutes,
        prefileDepartureMaxMinutes,
        prefileMaxTardinessMinutes,
        bookingsMaxHours,
        save
    }
})