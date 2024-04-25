<template>
    <v-snackbar v-model="snackbar" timeout="10000" color="grey-darken-4" class="mb-3">
        <span v-html="snackbarText" :class="'text-body-1 text-' + snackbarColor" />

        <template v-slot:actions>
            <v-btn icon size="small" @click="snackbar = false"><v-icon>mdi-close</v-icon></v-btn>
        </template>
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useVatsimStore } from "@/store/vatsim"
import { useSettingsStore } from "@/store/settings"
import { arrivalDistance, departureDistance, distanceToAirport, eta, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import constants from "@/constants"
import moment from "moment"
import { Howl } from "howler"

const props = defineProps<{ icaos: string[] }>()

const departurePopupSound = new Howl({ src: "/audio/pop.mp3" })
const arrivalPopupSound = new Howl({ src: "/audio/decide.mp3" })

const vatsim = useVatsimStore()
const settings = useSettingsStore()

const snackbar = ref(false)
const snackbarText = ref("")
const snackbarColor = ref("")

const airports = computed(() => (vatsim.spy ? vatsim.spy.airports.filter((a) => props.icaos.includes(a.icao)) : []))

const departures = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.data.prefiles || !vatsim.spy || !vatsim.spy.airports) return []
    return [
        // departing
        ...vatsim.data.pilots.filter(
            (p) =>
                p.flight_plan &&
                props.icaos.includes(p.flight_plan.departure) &&
                p.groundspeed < constants.inflightGroundspeed &&
                departureDistance(p) < constants.atAirportDistance
        ),
        // nofp
        ...vatsim.data.pilots.filter(
            (p) =>
                !p.flight_plan &&
                p.groundspeed < constants.motionGroundspeed &&
                airports.value.find((a) => distanceToAirport(p, a) < constants.atAirportDistance)
        ),
        // invalidfp
        ...vatsim.data.pilots.filter(
            (p) =>
                p.flight_plan &&
                !props.icaos.includes(p.flight_plan.departure) &&
                !props.icaos.includes(p.flight_plan.arrival) &&
                !props.icaos.includes(p.flight_plan.alternate) &&
                airports.value.find((a) => distanceToAirport(p, a) < constants.atAirportDistance) &&
                p.groundspeed < constants.motionGroundspeed
        ),
        // prefile
        ...vatsim.data.prefiles.filter(
            (p) =>
                p.flight_plan &&
                props.icaos.includes(p.flight_plan.departure) &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    (flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")) &&
                        flightplanDepartureTime(p.flight_plan)?.isBefore(moment().add(settings.prefileDepartureMaxMinutes, "minute"))))
        ),
    ].sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const arrivals = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return [
        ...vatsim.data.pilots.filter((p) => {
            if (!p.flight_plan || !props.icaos.includes(p.flight_plan.arrival) || props.icaos.includes(p.flight_plan.departure))
                return false
            const departed = p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance
            const etaOrArrivalTime = eta(p) || flightplanArrivalTime(p.flight_plan, !departed)
            return (
                (p.groundspeed >= constants.inflightGroundspeed || arrivalDistance(p) >= constants.atAirportDistance) &&
                (!etaOrArrivalTime || etaOrArrivalTime.isBefore(moment().add(settings.arrivingMaxMinutes, "minute")))
            )
        }),
    ].sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const departureCallsigns = () => departures.value.map((p) => p.callsign)
let lastDepartures = vatsim.data && vatsim.data.pilots && vatsim.data.prefiles ? departureCallsigns() : undefined
const newDepartures = ref([] as string[])
let departureTimeout: any = undefined

watch(departures, () => {
    if (departureTimeout) clearTimeout(departureTimeout)
    departureTimeout = setTimeout(() => {
        departureTimeout = undefined
        let popups = []
        const allDepartures = departureCallsigns()
        if (typeof lastDepartures != "undefined") {
            for (const callsign of allDepartures) {
                if (!lastDepartures.includes(callsign)) popups.push(callsign)
            }
        }
        lastDepartures = allDepartures
        newDepartures.value = popups
        if (popups.length > 0) {
            if (settings.soundOn) {
                departurePopupSound.volume(settings.soundVolume / 100)
                departurePopupSound.play()
            }
            snackbarText.value =
                popups.length > 1
                    ? `New departures <b style='font-family: monospace'>${popups.join(", ")}</b>.`
                    : `New departure <b style='font-family: monospace'>${popups[0]}</b>.`
            snackbarColor.value = "cyan"
            snackbar.value = true
        }
    }, 1000)
})

const arrivalCallsigns = () => arrivals.value.map((p) => p.callsign)
let lastArrivals = vatsim.data && vatsim.data.pilots && vatsim.data.prefiles ? arrivalCallsigns() : undefined
const newArrivals = ref([] as string[])
let arrivalTimeout: any = undefined

watch(arrivals, () => {
    if (arrivalTimeout) clearTimeout(arrivalTimeout)
    arrivalTimeout = setTimeout(() => {
        arrivalTimeout = undefined
        let popups = []
        const allArrivals = arrivalCallsigns()
        if (typeof lastArrivals != "undefined") {
            for (const callsign of allArrivals) {
                if (!lastArrivals.includes(callsign)) popups.push(callsign)
            }
        }
        lastArrivals = allArrivals
        newArrivals.value = popups
        if (popups.length > 0) {
            if (settings.soundOn) {
                arrivalPopupSound.volume(settings.soundVolume / 100)
                arrivalPopupSound.play()
            }
            snackbarText.value =
                popups.length > 1
                    ? `New arrivals <b style='font-family: monospace'>${popups.join(", ")}</b>.`
                    : `New arrival <b style='font-family: monospace'>${popups[0]}</b>.`
            snackbarColor.value = "yellow"
            snackbar.value = true
        }
    }, 500)
})

watch(props, () => {
    lastDepartures = departureCallsigns()
    lastArrivals = arrivalCallsigns()
})
</script>
