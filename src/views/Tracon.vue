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
        <div v-for="airport in activeAirports" :key="airport.icao" class="mt-5">
            <v-row no-gutters @click="clickAirport(airport.icao)" style="cursor: pointer; background: #313338">
                <v-col cols="2" sm="1">
                    <div class="text-h6 pl-1">{{ airport.icao }}</div>
                </v-col>
                <v-col cols="10" sm="11">
                    <div class="float-right text-right pt-1 px-1">
                        <span v-if="vatsim.movements[airport.icao].prefiledDepartures > 0" class="text-grey ml-3">{{ vatsim.movements[airport.icao].prefiledDepartures }}</span>
                        <span v-if="vatsim.movements[airport.icao].nofp > 0" class="text-grey-lighten-1 ml-3">{{ vatsim.movements[airport.icao].nofp }}</span>
                        <span v-if="vatsim.movements[airport.icao].invalidfp > 0" class="text-error ml-3">{{ vatsim.movements[airport.icao].invalidfp }}</span>
                        <span v-if="vatsim.movements[airport.icao].departing > 0" class="text-cyan-lighten-2 ml-3">{{ vatsim.movements[airport.icao].departing }}</span>
                        <span v-if="vatsim.movements[airport.icao].departed > 0" class="text-cyan-darken-3 ml-3">{{ vatsim.movements[airport.icao].departed }}</span>
                        <span v-if="vatsim.movements[airport.icao].prefiledArrivals > 0" class="text-grey ml-3">{{ vatsim.movements[airport.icao].prefiledArrivals }}</span>
                        <span v-if="vatsim.movements[airport.icao].arriving > 0" class="text-yellow-lighten-2 ml-3">{{ vatsim.movements[airport.icao].arriving }}</span>
                        <span v-if="vatsim.movements[airport.icao].arrived > 0" class="text-brown-lighten-1 ml-3">{{ vatsim.movements[airport.icao].arrived }}</span>
                        <span class="ml-2">
                            <Atis
                                compact
                                v-for="atis in atises(airport.icao)"
                                :key="atis.callsign"
                                :value="atis"
                                class="ml-1"
                                @click="clickAtis"
                            />
                            <Controller
                                compact
                                v-for="controller in localControllers(airport.icao)"
                                :key="controller.callsign"
                                :value="controller"
                                class="ml-1"
                            />
                        </span>
                    </div>
                    <div class="font-weight-light text-grey-lighten-1 text-truncate pa-1" style="direction: rtl">
                        {{ airport.name }}
                    </div>
                </v-col>
            </v-row>
            <v-row no-gutters class="mt-2">
                <v-col cols="12" sm="6">
                    <departure-list compact :icao="airport.icao" @click="clickFlight" />
                </v-col>
                <v-col cols="12" sm="6">
                    <arrival-list compact :icao="airport.icao" @click="clickFlight" />
                </v-col>
            </v-row>
        </div>
        <div v-if="enroutePilots.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Enroute</div>
            <a @click="clickFlight(p.callsign)" v-for="p in enroutePilots" class="text-grey-lighten-1 pa-1 mr-1">{{ p.callsign }}</a>
        </div>
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" :prefix="id" class="mt-1" />
        </div>
        <div class="text-grey-darken-1 text-body-2 mt-5" v-if="inactiveAirportIds && inactiveAirportIds.length > 0">
            <div class="text-caption text-grey-darken-2">Inactive airports</div>
            <span v-for="id in inactiveAirportIds"
                ><router-link :to="`/airport/${id}`" class="text-grey-darken-1">{{ id }}</router-link
                >&nbsp;
            </span>
        </div>

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
        <flight-notification :icaos="icaos" />
        <atc-notification :id="id" :callsigns="atcCallsigns" />
    </v-container>
</template>

<script setup lang="ts">
import ArrivalList from "@/components/ArrivalList.vue"
import Atis from "@/components/Atis.vue"
import Controller from "@/components/Controller.vue"
import DepartureList from "@/components/DepartureList.vue"
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
const atis = ref(undefined as any)
const showAtisDialog = ref(false)

const airports = computed(
    () =>
        vatsim.spy &&
        vatsim.spy.airports &&
        vatsim.spy.airports.filter((a) => !a.pseudo && boundary.value?.getGeometry()?.intersectsCoordinate([a.longitude, a.latitude]))
)
const icaos = computed(() => (airports.value ? airports.value.map((a) => a.icao) : []))

const activeAirports = computed(
    () =>
        airports.value &&
        airports.value
            .filter((a) => {
                if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
                if (vatsim.movements[a.icao].total > 0) return true
                if (vatsim.data.controllers && vatsim.data.controllers.find((c) => isMatchingAirportCallsign(c.callsign, a.icao)))
                    return true
                if (vatsim.data.atis && vatsim.data.atis.find((c) => isMatchingAirportCallsign(c.callsign, a.icao))) return true
            })
            .sort((a, b) => {
                if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
                if (!(b.icao in vatsim.movements)) vatsim.movements[b.icao] = vatsim.countMovements(b.icao)
                const acount = vatsim.movements[a.icao].total
                const bcount = vatsim.movements[b.icao].total
                if (acount == bcount) {
                    if (id.value.startsWith(a.icao)) return -1
                    else if (id.value.startsWith(b.icao)) return 1
                    else return a.icao.localeCompare(b.icao)
                }
                return acount >= bcount ? -1 : 1
            })
)

const inactiveAirportIds = computed(
    () => airports.value && airports.value.map((a) => a.icao).filter((icao) => !activeAirports.value.find((a) => a.icao == icao))
)

const fir = computed(
    () =>
        vatsim.spy &&
        vatsim.spy.firs &&
        vatsim.spy.firs.find((f) => airports.value && airports.value.length > 0 && f.icao == airports.value[0].fir)
)

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
            (callsign.endsWith("_CTR") && fir.value && !fir.value.callsignPrefix && callsign.startsWith(`${fir.value.icao}_`)))
    )
}

const atises = (icao: string) =>
    (vatsim.data &&
        vatsim.data.atis &&
        vatsim.data.atis
            .filter((c) => c.callsign && c.callsign.startsWith(`${icao}_`))
            .sort((a, b) => a.callsign.localeCompare(b.callsign))) ||
    []

const localControllers = (icao: string) =>
    (vatsim.data &&
        vatsim.data.controllers &&
        vatsim.data.controllers
            .filter((c) => c.facility > 0 && (settings.showUnprimedControllers || c.frequency != "199.998") && isMatchingAirportCallsign(c.callsign, icao))
            .sort((a, b) => a.callsign.localeCompare(b.callsign))) ||
    []

function isMatchingAirportCallsign(callsign: string, icao: string) {
    return (
        callsign &&
        !callsign.endsWith("_CTR") &&
        !callsign.endsWith("_APP") &&
        !callsign.endsWith("_DEP") &&
        (callsign.startsWith(`${icao}_`) || (icao.startsWith("K") && callsign.startsWith(`${icao.substring(1)}_`)))
    )
}

function isMatchingAnyAirportCallsign(callsign: string) {
    return airports.value && airports.value.find((a) => isMatchingAirportCallsign(callsign, a.icao))
}

const atcCallsigns = computed(() => {
    const callsigns: string[] = []
    for (const controller of controllers.value) callsigns.push(controller.callsign)
    for (const icao of icaos.value) {
        for (const atis of atises(icao)) callsigns.push(atis.callsign)
        for (const controller of localControllers(icao)) callsigns.push(controller.callsign)
    }
    return callsigns
})

function clickAirport(icao: string) {
    if (!showAtisDialog.value && !showFlightDialog.value) router.push(`/airport/${icao}`)
}

function clickFlight(callsign: string) {
    if (display.xs.value) {
        router.push(`/flight/${callsign}`)
    } else {
        flightCallsign.value = callsign
        showFlightDialog.value = true
    }
}

function clickAtis(atisClicked: any) {
    atis.value = atisClicked
    showAtisDialog.value = true
}

watch(id, () => {
    showFlightDialog.value = false
})
</script>
