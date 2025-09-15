<template>
    <v-container fluid>
        <v-row>
            <v-col cols="4">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="country" class="mt-2">
                    {{ country.name }}
                    {{ country.facility }}
                </div>
            </v-col>
        </v-row>
        <v-row>
            <Controller v-for="controller in controllers" :key="controller.cid" :value="controller" />
        </v-row>
        <div class="mt-3 text-grey">
            <v-btn
                v-if="!expanded"
                variant="text"
                size="small"
                class="float-right"
                icon="mdi-chevron-down"
                @click="expanded = true"
            ></v-btn>
            <v-btn v-else variant="text" size="small" class="float-right" icon="mdi-chevron-up" @click="expanded = false"></v-btn>
            <span v-if="totalPilotsCount > 0"
                ><span class="text-white">{{ totalPilotsCount }}</span> flights</span
            >
            <span v-else-if="totalPilotsCount == 0">No flights</span>
            <span v-if="inflightPilotsCount > 0 && inflightPilotsCount != totalPilotsCount" class="ml-2"
                ><span class="text-white">{{ inflightPilotsCount }}</span> in flight</span
            >
        </div>
        <div v-if="expanded">
            <airports-list :icaos="airportIcaos" hide-inactive @click-airport="clickAirport" @click-flight="clickFlight" />
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
        </div>
        <div v-else>
            <div v-if="country && firs" class="text-grey-lighten-1 pa-1 mt-5 mb-2" style="background: #313338">
                <v-row>
                    <v-col cols="6" sm="6">Active airports </v-col>
                    <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-takeoff</v-icon></v-col>
                    <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-landing</v-icon></v-col>
                    <v-col cols="3" sm="4" class="text-right d-none d-sm-block"><v-icon>mdi-antenna</v-icon></v-col>
                </v-row>
            </div>
            <airport-top-list v-if="firs" :firs="firs.map((f) => f.icao)" class="mt-2" />
        </div>
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
        </div>
        <div v-if="firs && firs.length > 0" class="mt-5">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">FIRs</div>
            <v-row no-gutters>
                <v-col
                    cols="12"
                    sm="4"
                    v-for="fir in firs"
                    :key="fir.icao"
                    @click="router.push(`/fir/${fir.icao}`)"
                    class="fir pa-1 text-truncate"
                >
                    {{ fir.icao }} <span class="text-grey-lighten-1 text-body-2">{{ fir.name }}</span>
                </v-col>
            </v-row>
        </div>
        <div v-if="expanded">
            <v-dialog v-model="showFlightDialog" width="90%">
                <v-card color="#1e1f22">
                    <v-card-text class="pa-3">
                        <flight-details :id="flightCallsign" />
                    </v-card-text>
                </v-card>
            </v-dialog>
            <flight-notification :icaos="airportIcaos" />
            <atc-notification :id="id" :callsigns="atcCallsigns" />
        </div>
        <div v-if="!country && vatsim.spy.countries" class="text-h5 font-weight-light text-grey mt-5">No country known by that ID.</div>
    </v-container>
</template>

<style>
.fir:hover {
    background: #333;
    cursor: pointer;
}
</style>

<script lang="ts" setup>
import AirportsList from "@/components/AirportsList.vue"
import AirportTopList from "@/components/AirportTopList.vue"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import FlightNotification from "@/components/FlightNotification.vue"
import AtcNotification from "@/components/AtcNotification.vue"
import constants from "@/constants"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify/lib/framework.mjs"
const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()
const display = useDisplay()

const id = computed(() => (route.params.id as string).toUpperCase())

const expanded = ref(!!("countryExpanded" in localStorage))
const showFlightDialog = ref(false)
const flightCallsign = ref("")

const country = computed(() => {
    return vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find((c) => c.prefix == id.value)
})

const firs = computed(() => {
    return (
        vatsim.spy &&
        vatsim.spy.firs &&
        vatsim.spy.firs
            .filter((f) => f.icao.startsWith(id.value) && vatsim.spy.airports.find((a) => a.fir == f.icao))
            .sort((a, b) => a.icao.localeCompare(b.icao))
    )
})

const firIcaos = computed(() => firs.value.map((f) => f.icao))

const airportIcaos = computed(
    () => (vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.filter((a) => firIcaos.value.includes(a.fir)).map((a) => a.icao)) || []
)

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    const callsignPrefixes: string[] = []
    if (firs.value) {
        for (const fir of firs.value) {
            if (fir.callsignPrefix) callsignPrefixes.push(fir.callsignPrefix)
        }
    }
    return vatsim.data.controllers.filter(
        (c) =>
            c.facility > 0 &&
            c.callsign &&
            (c.callsign.endsWith("_CTR") || (id.value == "ES" && c.callsign == "ESSR_MM_APP")) &&
            !c.callsign.endsWith("_OBS") &&
            ((c.callsign.startsWith(id.value) && c.callsign[4] == "_") || callsignPrefixes.find((prefix) => c.callsign.startsWith(prefix)))
    )
})

const enroutePilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.boundaries) return []
    const boundaries = vatsim.boundaries.filter((b) => firIcaos.value.includes(b.getProperties().id))
    if (boundaries.length == 0) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.groundspeed >= constants.inflightGroundspeed &&
                boundaries.find((b) => b.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude])) &&
                (!p.flight_plan ||
                    (!airportIcaos.value.includes(p.flight_plan.departure) && !airportIcaos.value.includes(p.flight_plan.arrival)))
        )
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const bookings = computed(() => {
    if (!vatsim.bookings) return []
    const callsignPrefixes: string[] = []
    if (firs.value) {
        for (const fir of firs.value) {
            if (fir.callsignPrefix) callsignPrefixes.push(fir.callsignPrefix)
        }
    }
    return vatsim.bookings
        .filter(
            (b) =>
                moment(b.start) &&
                moment(b.start).utc().isBefore(moment().add(settings.bookingsMaxHours, "hour")) &&
                moment(b.end).utc().isAfter(moment()) &&
                b.callsign &&
                (((b.callsign.endsWith("_CTR") || (id.value == "ES" && b.callsign == "ESSR_MM_APP")) &&
                    ((b.callsign.startsWith(id.value) && b.callsign[4] == "_") ||
                        callsignPrefixes.find((prefix) => b.callsign.startsWith(prefix)))) ||
                    (!b.callsign.endsWith("_CTR") && isAirportCallsign(b.callsign)))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)))
})

const totalPilotsCount = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.boundaries) return -1
    const boundaries = vatsim.boundaries.filter((b) => firIcaos.value.includes(b.getProperties().id))
    if (boundaries.length == 0) return -1
    return vatsim.data.pilots.filter((p) => boundaries.find((b) => b.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude]))).length
})

const inflightPilotsCount = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.boundaries) return -1
    const boundaries = vatsim.boundaries.filter((b) => firIcaos.value.includes(b.getProperties().id))
    if (boundaries.length == 0) return -1
    return vatsim.data.pilots.filter(
        (p) =>
            p.groundspeed >= constants.inflightGroundspeed &&
            boundaries.find((b) => b.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude]))
    ).length
})

const atcCallsigns = computed(() => {
    const callsigns: string[] = []
    for (const controller of controllers.value) callsigns.push(controller.callsign)
    for (const icao of airportIcaos.value) {
        for (const atis of vatsim.getAtises(icao)) callsigns.push(atis.callsign)
        for (const controller of vatsim.getLocalControllers(icao)) callsigns.push(controller.callsign)
    }
    return callsigns
})

function isAirportCallsign(callsign: string) {
    const airport = vatsim.airportByIcao[callsign.substring(0, 4)]
    if (airport && airport.fir && airport.fir.startsWith(id.value)) return true
    return false
}

watch(expanded, () => {
    if (expanded.value) localStorage.countryExpanded = true
    else localStorage.removeItem("countryExpanded")
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
</script>
