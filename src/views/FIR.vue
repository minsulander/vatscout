<template>
    <div class="pa-2">
        <v-row>
            <v-col cols="4">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="fir" class="mt-3">
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
            <v-row class="mt-2">
                <Controller v-for="controller in controllers" :value="controller" :prefix="id" :key="controller.cid"/>
            </v-row>
            <div class="text-grey-lighten-1 pa-1 mt-5 mb-2" style="background: #313338">
                <v-row>
                    <v-col cols="6" sm="6">Active airports </v-col>
                    <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-takeoff</v-icon></v-col>
                    <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-landing</v-icon></v-col>
                    <v-col cols="3" sm="4" class="text-right d-none d-sm-block"><v-icon>mdi-antenna</v-icon></v-col>
                </v-row>
            </div>
            <airport-top-list :fir="id" class="mt-2" />
            <div v-if="bookings.length > 0" class="mt-5 text-grey">
                <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
                <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
            </div>
        </div>
        <div v-if="!fir && vatsim.spy.firs" class="text-h5 font-weight-light text-grey mt-5">No FIR known by that ID.</div>
    </div>
</template>

<script lang="ts" setup>
import { compareControllers } from "@/common"
import AirportTopList from "@/components/AirportTopList.vue"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed } from "vue"
import { useRoute } from "vue-router"
const route = useRoute()
const vatsim = useVatsimStore()
const settings = useSettingsStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const fir = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == id.value)
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
                moment(b.start) &&
                moment(b.start).utc().isBefore(moment().add(settings.bookingsMaxHours, "hour")) &&
                moment(b.end).utc().isAfter(moment()) &&
                (isMatchingCallsign(b.callsign) || isAirportCallsign(b.callsign))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)))
})

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        !callsign.endsWith("_OBS") &&
        (callsign.startsWith(`${id.value}_`) ||
            (fir.value && fir.value.callsignPrefix && callsign.startsWith(fir.value.callsignPrefix)) ||
            (id.value.startsWith("K") && callsign.startsWith(`${id.value.substring(1)}_`)))
    )
}

function isAirportCallsign(callsign: string) {
    if (!fir.value) return false
    const airport = vatsim.airportByIcao[callsign.substring(0, 4)]
    if (airport && airport.fir == fir.value.icao) return true
    return false
}
</script>
