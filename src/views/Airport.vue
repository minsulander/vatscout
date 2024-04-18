<template>
    <v-container>
        <v-row>
            <v-col cols="4">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="airport" class="mt-3">
                    <span class="d-none d-sm-inline">
                        <span v-if="airport.iata"
                            ><span class="pa-1">{{ airport.iata }}</span> |
                        </span>
                        <span class="pa-1">{{ airport.name }}</span> |
                    </span>
                    <span v-if="tracon"
                        ><router-link :to="`/tracon/${tracon.id}`" class="pa-1">{{ tracon.id }}_APP</router-link> |</span
                    >
                    <router-link :to="`/fir/${airport.fir}`" class="pa-1">{{ airport.fir }}</router-link> |
                    <router-link :to="`/country/${airport.fir.substring(0, 2)}`" class="pa-1">{{
                        airport.fir.substring(0, 2)
                    }}</router-link>
                </div>
            </v-col>
        </v-row>
        <div class="d-sm-none text-grey-lighten-1 text-h6 font-weight-light mb-3" v-if="airport">
            <span v-if="airport.iata"
                ><span class="pa-1">{{ airport.iata }}</span> |
            </span>
            <span class="pa-1">{{ airport.name }}</span>
        </div>
        <v-row>
            <Atis v-for="atis in atises" :key="atis.callsign" :value="atis" :prefix="id" @click="clickAtis(atis)"/>
            <Controller v-for="controller in controllers" :key="controller.cid" :value="controller" :prefix="id" />
        </v-row>
        <v-row class="mt-3">
            <v-col cols="12" sm="6">
                <departure-list :icao="id" :new-departures="newDepartures" @click="clickFlight" />
            </v-col>
            <v-col cols="12" sm="6">
                <arrival-list :icao="id" :new-arrivals="newArrivals" @click="clickFlight" />
            </v-col>
        </v-row>
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" :prefix="id" class="mt-1" />
        </div>
        <v-snackbar v-model="snackbar" timeout="10000" color="grey-darken-4" class="mb-3">
            <span v-html="snackbarText" :class="'text-body-1 text-' + snackbarColor" />

            <template v-slot:actions>
                <v-btn icon size="small" @click="closeSnackbar"><v-icon>mdi-close</v-icon></v-btn>
            </template>
        </v-snackbar>
        <!--
        <v-btn @click="snackbar=true; snackbarColor='cyan'; snackbarText='New departure <b style=\'font-family: monospace\'>ABC123</b>'">Test snackbar</v-btn>
        -->
        <v-dialog v-model="showFlightDialog" width="90%">
            <v-card color="#1e1f22">
                <v-card-text class="pa-3">
                    <flight-details :id="flightCallsign" />
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog v-model="showAtisDialog" width="600">
            <v-card v-if="atis">
                <v-card-text>
                    {{ atis.text_atis?.join("\n") }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script lang="ts" setup>
import { arrivalDistance, departureDistance, distanceToAirport, eta, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import { compareCallsigns, compareControllers, extractAtisCode } from "@/common"
import Booking from "@/components/Booking.vue"
import Atis from "@/components/Atis.vue"
import Controller from "@/components/Controller.vue"
import DepartureList from "@/components/DepartureList.vue"
import ArrivalList from "@/components/ArrivalList.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import constants from "@/constants"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify"
import { minutes2hhmm } from "@/common"

const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()
const display = useDisplay()

const id = computed(() => (route.params.id as string)?.toUpperCase())
const showFlightDialog = ref(false)
const flightCallsign = ref("")
const snackbar = ref(false)
const snackbarText = ref("")
const snackbarColor = ref("")

const airport = computed(() => vatsim.airportByIcao[id.value])

const atis = ref(undefined as any)
const showAtisDialog = ref(false)

const tracon = computed(() => {
    if (!airport.value || !vatsim.traconBoundaries) return undefined
    const boundary = vatsim.traconBoundaries.find(
        (b) => b.getGeometry() && b.getGeometry()!.intersectsCoordinate([airport.value.longitude, airport.value.latitude])
    )
    if (!boundary) return undefined
    return boundary.getProperties()
})

const departures = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return [
        // departing
        ...vatsim.data.pilots.filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                p.groundspeed < constants.inflightGroundspeed &&
                departureDistance(p) < constants.atAirportDistance
        ),
        // nofp
        ...vatsim.data.pilots.filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                p.groundspeed < constants.inflightGroundspeed &&
                departureDistance(p) < constants.atAirportDistance
        ),
        // prefile
        ...vatsim.data.prefiles.filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    (flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")) &&
                        flightplanDepartureTime(p.flight_plan)?.isBefore(moment().add(settings.prefileDepartureMaxMinutes, "minute"))))
        ),
    ].sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const arrivals = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return [
        ...vatsim.data.pilots
        .filter((p) => {
            if (!p.flight_plan || p.flight_plan.arrival != id.value || p.flight_plan.departure == id.value) return false
            const departed = p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance
            const etaOrArrivalTime = eta(p) || flightplanArrivalTime(p.flight_plan, !departed)
            return (
                (p.groundspeed >= constants.inflightGroundspeed || arrivalDistance(p) >= constants.atAirportDistance) &&
                (!etaOrArrivalTime || etaOrArrivalTime.isBefore(moment().add(settings.arrivingMaxMinutes, "minute")))
            )
        }),
        ...vatsim.data.prefiles
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.arrival == id.value &&
                p.flight_plan.departure != id.value &&
                (!flightplanArrivalTime(p.flight_plan) ||
                    flightplanArrivalTime(p.flight_plan)?.isBefore(moment().add(settings.arrivingMaxMinutes, "minute"))) &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")))
        )
    ].sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const fir = computed(() => vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => airport.value && f.icao == airport.value.fir))

const atises = computed(() => {
    if (!vatsim.data.atis) return []
    return vatsim.data.atis
        .filter((c) => c.callsign && c.callsign.startsWith(`${id.value}_`))
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter((c) => c.facility > 0 && isMatchingCallsign(c.callsign)).sort(compareControllers)
})

const bookings = computed(() => {
    if (!vatsim.bookings) return []
    return vatsim.bookings
        .filter(
            (b) =>
                //!controllers.value.find(c => c.callsign == b.callsign) &&
                moment(b.start) &&
                moment(b.end) &&
                moment(b.start).utc().isBefore(moment().add(settings.bookingsMaxHours, "hour")) &&
                moment(b.end).utc().isAfter(moment()) &&
                isMatchingCallsign(b.callsign)
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)) || compareCallsigns(a.callsign, b.callsign))
})

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        id.value &&
        ((!callsign.endsWith("_CTR") &&
            (callsign.startsWith(`${id.value}_`) || (id.value.startsWith("K") && callsign.startsWith(`${id.value.substring(1)}_`)))) ||
            (callsign.endsWith("_CTR") && airport.value && callsign.startsWith(`${airport.value.fir}_`)) ||
            (callsign.endsWith("_CTR") && fir.value && fir.value.callsignPrefix && callsign.startsWith(`${fir.value.callsignPrefix}_`)))
    )
}

function closeSnackbar() {
    snackbar.value = false
    newDepartures.value = []
    newArrivals.value = []
}

function clickFlight(callsign: string) {
    if (display.xs.value) {
        router.push(`/flight/${callsign}`)
    } else {
        flightCallsign.value = callsign
        showFlightDialog.value = true
    }
}

function clickAtis(atisClicked: Atis) {
    atis.value = atisClicked
    showAtisDialog.value = true
}

import { Howl } from "howler"

const departurePopupSound = new Howl({ src: "/audio/pop.mp3" })
const arrivalPopupSound = new Howl({ src: "/audio/decide.mp3" })
const atcPopupSound = new Howl({ src: "/audio/notification.mp3" })

const departureCallsigns = () => departures.value.map((p) => p.callsign)
let lastDepartures = vatsim.data.pilots ? departureCallsigns() : undefined
const newDepartures = ref([] as string[])
watch(departures, () => {
    setTimeout(() => {
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
            setTimeout(() => (newDepartures.value = []), 10000)
        }
    }, 1000)
})

const arrivalCallsigns = () => arrivals.value.map((p) => p.callsign)
let lastArrivals = vatsim.data.pilots ? arrivalCallsigns() : undefined
const newArrivals = ref([] as string[])
watch(arrivals, () => {
    setTimeout(() => {
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
            setTimeout(() => (newArrivals.value = []), 10000)
        }
    }, 500)
})

const atcCallsigns = () => [...atises.value.map((a) => a.callsign), ...controllers.value.map((c) => c.callsign)]
let lastAtc = vatsim.data.controllers ? atcCallsigns() : undefined
watch([atises, controllers], () => {
    setTimeout(() => {
        let popups = []
        let popoffs = []
        const allAtc = atcCallsigns()
        if (typeof lastAtc != "undefined") {
            for (const callsign of allAtc) {
                if (!lastAtc.includes(callsign)) popups.push(callsign)
            }
            for (const callsign of lastAtc) {
                if (!allAtc.includes(callsign)) popoffs.push(callsign)
            }
        }
        lastAtc = allAtc
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

watch(id, () => {
    showFlightDialog.value = false
    if (!id.value || !airport.value) {
        lastDepartures = lastArrivals = lastAtc = []
    } else {
        lastDepartures = departureCallsigns()
        lastArrivals = arrivalCallsigns()
        lastAtc = atcCallsigns()
    }
})
</script>
