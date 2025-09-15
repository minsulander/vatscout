<template>
    <v-container fluid>
        <v-row no-gutters>
            <v-col cols="4">
                <div class="text-h4">{{ id }}_APP</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="tracon" class="mt-2">
                    <span class="d-none d-sm-inline">
                        <span class="pa-1">{{ tracon.name }}</span> |
                    </span>
                    <span v-if="fir"
                        ><router-link :to="`/fir/${fir.icao}`" class="pa-1">{{ fir.icao }}</router-link> |</span
                    >
                    <router-link :to="`/country/${id.substring(0, 2)}`" class="pa-1">{{ id.substring(0, 2) }}</router-link>
                </div>
            </v-col>
        </v-row>
        <div class="d-sm-none text-grey-lighten-1 text-h6 font-weight-light" v-if="tracon">
            {{ tracon.name }}
        </div>
        <v-row no-gutters>
            <Controller v-for="controller in controllers" :key="controller.cid" :value="controller" :prefix="id" />
        </v-row>
        <airports-list no-app-dep :icaos="icaos" @click-airport="clickAirport" @click-flight="clickFlight" />
        <div v-if="enroutePilots.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Enroute</div>
            <a
                @click="clickFlight(p.callsign)"
                v-for="p in enroutePilots"
                :key="p.callsign"
                class="text-grey-lighten-1 px-1 d-inline-block"
                >{{ p.callsign }}</a
            >
        </div>
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" :prefix="id" class="mt-1" />
        </div>

        <v-dialog v-model="showFlightDialog" width="90%">
            <v-card color="#1e1f22">
                <v-card-text class="pa-3">
                    <flight-details :id="flightCallsign" />
                </v-card-text>
            </v-card>
        </v-dialog>
        <flight-notification :icaos="icaos" />
        <atc-notification :id="id" :callsigns="atcCallsigns" />
    </v-container>
</template>

<script setup lang="ts">
import AirportsList from "@/components/AirportsList.vue"
import Controller from "@/components/Controller.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import FlightNotification from "@/components/FlightNotification.vue"
import AtcNotification from "@/components/AtcNotification.vue"
import Booking from "@/components/Booking.vue"
import moment from "moment"

import { compareCallsigns, compareControllers } from "@/common"
import { useVatsimStore } from "@/store/vatsim"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useSettingsStore } from "@/store/settings"
import { useDisplay } from "vuetify/lib/framework.mjs"
import constants from "@/constants"

const vatsim = useVatsimStore()
const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const display = useDisplay()

const id = computed(() => (route.params.id as string)?.toUpperCase())
const boundary = computed(() => vatsim.traconBoundaries.find((b) => b.getProperties().id.toUpperCase() == id.value))
const tracon = computed(() => boundary.value?.getProperties())

const showFlightDialog = ref(false)
const flightCallsign = ref("")

const airports = computed(
    () =>
        vatsim.spy &&
        vatsim.spy.airports &&
        vatsim.spy.airports.filter((a) => !a.pseudo && boundary.value?.getGeometry()?.intersectsCoordinate([a.longitude, a.latitude]))
)
const icaos = computed(() => (airports.value ? airports.value.map((a) => a.icao) : []))

const fir = computed(() => {
    const mainAirport = vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == id.value)
    if (mainAirport && mainAirport.fir)
        return vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == mainAirport.fir)
    else return (
        vatsim.spy &&
        vatsim.spy.firs &&
        vatsim.spy.firs.find((f) => airports.value && airports.value.length > 0 && f.icao == airports.value[0].fir)
    )
})

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers
        .filter((c) => c.facility > 0 && (settings.showUnprimedControllers || c.frequency != "199.998") && isMatchingCallsign(c.callsign))
        .sort(compareControllers)
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
                (isMatchingCallsign(b.callsign) || isMatchingAnyAirportCallsign(b.callsign))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)) || compareCallsigns(a.callsign, b.callsign))
})

const enroutePilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.traconBoundaries) return []
    const boundary = vatsim.traconBoundaries.find((b) => b.getProperties().id == id.value)
    if (!boundary) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.groundspeed >= constants.inflightGroundspeed &&
                p.altitude < 20000 && // TODO hardcoded top of TMA
                boundary.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude]) &&
                (!p.flight_plan || (!icaos.value.includes(p.flight_plan.departure) && !icaos.value.includes(p.flight_plan.arrival)))
        )
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        ((!callsign.endsWith("_CTR") && callsign.startsWith(`${id.value}_`) && (callsign.endsWith("_APP") || callsign.endsWith("_DEP"))) ||
            (callsign.endsWith("_CTR") && fir.value && fir.value.callsignPrefix && callsign.startsWith(`${fir.value.callsignPrefix}_`)) ||
            (callsign.endsWith("_CTR") && fir.value && !fir.value.callsignPrefix && callsign.startsWith(`${fir.value.icao}_`)) ||
            (callsign.startsWith("ESAA") && callsign.endsWith("_CTR") && id.value.startsWith("ES")) ||
            (callsign == "ESSR_MM_APP" && fir.value && fir.value.icao == "ESMM"))
    )
}

function isMatchingAnyAirportCallsign(callsign: string) {
    return airports.value && airports.value.find((a) => vatsim.isMatchingAirportCallsign(callsign, a.icao))
}

const atcCallsigns = computed(() => {
    const callsigns: string[] = []
    for (const controller of controllers.value) callsigns.push(controller.callsign)
    for (const icao of icaos.value) {
        for (const atis of vatsim.getAtises(icao)) callsigns.push(atis.callsign)
        for (const controller of vatsim.getLocalControllers(icao)) callsigns.push(controller.callsign)
    }
    return callsigns
})

function clickAirport(icao: string) {
    if (!showFlightDialog.value) router.push(`/airport/${icao}`)
}

function clickFlight(callsign: string) {
    if (display.xs.value) {
        router.push(`/flight/${callsign}`)
    } else {
        flightCallsign.value = callsign
        showFlightDialog.value = true
    }
}

watch(id, () => {
    showFlightDialog.value = false
})
</script>
