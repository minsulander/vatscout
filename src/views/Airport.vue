<template>
    <v-container fluid>
        <v-row no-gutters>
            <v-col cols="3">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="9" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="airport" class="mt-2">
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
        <div class="d-sm-none text-grey-lighten-1 text-h6 font-weight-light" v-if="airport">
            <span v-if="airport.iata">{{ airport.iata }} | </span>
            <span>{{ airport.name }}</span>
        </div>
        <v-row no-gutters>
            <Metar v-if="atises.length == 0" :icao="id" />
            <Atis v-for="atis in atises" :key="atis.callsign" :value="atis" :prefix="id" @click="clickAtis(atis)" />
            <Controller v-for="controller in controllers" :key="controller.cid" :value="controller" :prefix="id" />
        </v-row>
        <v-row no-gutters>
            <v-col cols="12" sm="6" class="mt-5">
                <departure-list :icao="id" @click="clickFlight" />
            </v-col>
            <v-col cols="12" sm="6" class="mt-5">
                <arrival-list :icao="id" @click="clickFlight" />
            </v-col>
        </v-row>
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
        <v-dialog v-model="showAtisDialog" width="600">
            <v-card v-if="atis">
                <v-card-text>
                    {{ atis.text_atis?.join("\n") }}
                </v-card-text>
            </v-card>
        </v-dialog>
        <flight-notification :icaos="[id]" />
        <atc-notification :id="id" :callsigns="atcCallsigns" />
    </v-container>
</template>

<script lang="ts" setup>
import { compareCallsigns, compareControllers } from "@/common"
import ArrivalList from "@/components/ArrivalList.vue"
import AtcNotification from "@/components/AtcNotification.vue"
import Metar from "@/components/Metar.vue"
import Atis from "@/components/Atis.vue"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import DepartureList from "@/components/DepartureList.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import FlightNotification from "@/components/FlightNotification.vue"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify"

const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()
const display = useDisplay()

const id = computed(() => (route.params.id as string)?.toUpperCase())
const showFlightDialog = ref(false)
const flightCallsign = ref("")

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

const fir = computed(() => vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => airport.value && f.icao == airport.value.fir))

const atises = computed(() => {
    if (!vatsim.data.atis) return []
    return vatsim.data.atis
        .filter((c) => c.callsign && c.callsign.startsWith(`${id.value}_`))
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
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

const atcCallsigns = computed(() => [...atises.value.map((a) => a.callsign), ...controllers.value.map((c) => c.callsign)])

watch(id, () => {
    showFlightDialog.value = false
})
</script>
