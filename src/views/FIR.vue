<template>
    <v-container fluid>
        <v-row no-gutters>
            <v-col cols="4">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="fir" class="mt-2">
                    <span class="d-none d-sm-inline"
                        >{{ fir.name }}<span v-if="fir.callsignPrefix"> | {{ fir.callsignPrefix }}</span> |</span
                    >
                    <router-link :to="`/country/${id.substring(0, 2)}`" class="pa-1">{{ id.substring(0, 2) }}</router-link>
                </div>
            </v-col>
        </v-row>
        <div v-if="fir">
            <div class="d-sm-none text-grey-lighten-1 text-h6 font-weight-light">
                {{ fir.name }}<span v-if="fir.callsignPrefix"> | {{ fir.callsignPrefix }}</span>
            </div>
            <v-row class="mt-3">
                <Controller v-for="controller in controllers" :value="controller" :prefix="id" :key="controller.cid" />
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
                <div class="text-grey-lighten-1 pa-1 mt-5 mb-2" style="background: #313338">
                    <v-row>
                        <v-col cols="6" sm="6">Active airports </v-col>
                        <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-takeoff</v-icon></v-col>
                        <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-landing</v-icon></v-col>
                        <v-col cols="3" sm="4" class="text-right d-none d-sm-block"><v-icon>mdi-antenna</v-icon></v-col>
                    </v-row>
                </div>
                <airport-top-list :fir="id" class="mt-2" />
            </div>
            <div v-if="bookings.length > 0" class="mt-5 text-grey">
                <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
                <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
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
        </div>
        <div v-if="!fir && vatsim.spy.firs" class="text-h5 font-weight-light text-grey mt-5">No FIR known by that ID.</div>
    </v-container>
</template>

<script lang="ts" setup>
import { compareControllers } from "@/common"
import AirportTopList from "@/components/AirportTopList.vue"
import AirportsList from "@/components/AirportsList.vue"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import FlightNotification from "@/components/FlightNotification.vue"
import AtcNotification from "@/components/AtcNotification.vue"
import constants from "@/constants"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify/lib/framework.mjs"
import moment from "moment"
import { computed, ref, watch } from "vue"
const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()
const display = useDisplay()

const id = computed(() => (route.params.id as string).toUpperCase())

const expanded = ref(!!("firExpanded" in localStorage))
const showFlightDialog = ref(false)
const flightCallsign = ref("")

const fir = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == id.value)
})

const airportIcaos = computed(
    () => vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.filter((a) => a.fir == id.value).map((a) => a.icao) || []
)

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter((c) => c.facility > 0 && isMatchingCallsign(c.callsign)).sort(compareControllers)
})

const enroutePilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.boundaries) return []
    const boundary = vatsim.boundaries.find((b) => b.getProperties().id == id.value)
    if (!boundary) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.groundspeed >= constants.inflightGroundspeed &&
                boundary.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude]) &&
                (!p.flight_plan ||
                    (!airportIcaos.value.includes(p.flight_plan.departure) && !airportIcaos.value.includes(p.flight_plan.arrival)))
        )
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const bookings = computed(() => {
    if (!vatsim.bookings) return []
    return vatsim.bookings
        .filter(
            (b) =>
                moment(b.start) &&
                moment(b.start).utc().isBefore(moment().add(settings.bookingsMaxHours, "hour")) &&
                moment(b.end).utc().isAfter(moment()) &&
                (isMatchingCallsign(b.callsign) || isAirportCallsign(b.callsign))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)))
})

const totalPilotsCount = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.boundaries) return -1
    const boundary = vatsim.boundaries.find((b) => b.getProperties().id == id.value)
    if (!boundary || !boundary.getGeometry()) return -1
    return vatsim.data.pilots.filter((p) => boundary.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude])).length
})

const inflightPilotsCount = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots || !vatsim.boundaries) return -1
    const boundary = vatsim.boundaries.find((b) => b.getProperties().id == id.value)
    if (!boundary || !boundary.getGeometry()) return -1
    return vatsim.data.pilots.filter(
        (p) => p.groundspeed >= constants.inflightGroundspeed && boundary.getGeometry()?.intersectsCoordinate([p.longitude, p.latitude])
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

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        !callsign.endsWith("_OBS") &&
        (callsign.startsWith(`${id.value}_`) ||
            (fir.value && fir.value.callsignPrefix && callsign.startsWith(fir.value.callsignPrefix)) ||
            (callsign.startsWith("ESAA") && callsign.endsWith("_CTR") && id.value.startsWith("ES")) ||
            (callsign == "ESSR_MM_APP" && id.value.startsWith("ESMM")) ||
            (callsign == "ESSR_CTR" && id.value.startsWith("ESOS")) ||
            (id.value.startsWith("K") && callsign.startsWith(`${id.value.substring(1)}_`)))
    )
}

function isAirportCallsign(callsign: string) {
    if (!fir.value) return false
    const airport = vatsim.airportByIcao[callsign.substring(0, 4)]
    if (airport && airport.fir == fir.value.icao) return true
    return false
}

watch(expanded, () => {
    if (expanded.value) localStorage.firExpanded = true
    else localStorage.removeItem("firExpanded")
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
