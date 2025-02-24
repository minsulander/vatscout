<template>
    <v-container fluid>
        <airports-list :icaos="ids" @click-airport="clickAirport" @click-flight="clickFlight" />
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
        </div>

        <v-dialog v-model="showFlightDialog" width="90%">
            <v-card color="#1e1f22">
                <v-card-text class="pa-3">
                    <flight-details :id="flightCallsign" />
                </v-card-text>
            </v-card>
        </v-dialog>
        <flight-notification :icaos="ids" />
        <atc-notification :id="ids.join(',')" :callsigns="atcCallsigns" />
    </v-container>
</template>

<script setup lang="ts">
import AirportsList from "@/components/AirportsList.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import FlightNotification from "@/components/FlightNotification.vue"
import AtcNotification from "@/components/AtcNotification.vue"
import Booking from "@/components/Booking.vue"
import moment from "moment"

import { compareCallsigns } from "@/common"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import { useDisplay } from "vuetify/lib/framework.mjs"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()
const display = useDisplay()

const ids = computed(() => (route.params.ids as string)?.toUpperCase().split(/\W+/))

const showFlightDialog = ref(false)
const flightCallsign = ref("")

const airports = computed(
    () => vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.filter((a) => !a.pseudo && a.icao && ids.value.includes(a.icao))
)

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
                isMatchingAnyAirportCallsign(b.callsign)
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)) || compareCallsigns(a.callsign, b.callsign))
})

function isMatchingAnyAirportCallsign(callsign: string) {
    return airports.value && airports.value.find((a) => vatsim.isMatchingAirportCallsign(callsign, a.icao))
}

const atcCallsigns = computed(() => {
    const callsigns: string[] = []
    for (const icao of ids.value) {
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

watch(ids, () => {
    showFlightDialog.value = false
})
</script>
