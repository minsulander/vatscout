<template>
    <v-container>
        <v-row>
            <v-col cols="4">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="country" class="mt-3">
                    {{ country.name }}
                    {{ country.facility }}
                </div>
            </v-col>
        </v-row>
        <v-row class="mt-2">
            <Controller v-for="controller in controllers" :key="controller.cid" :value="controller" />
        </v-row>
        <div v-if="country && firs" class="text-grey-lighten-1 pa-1 mt-5 mb-2" style="background: #313338">
            <v-row>
                <v-col cols="6" sm="6">Active airports </v-col>
                <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-takeoff</v-icon></v-col>
                <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-landing</v-icon></v-col>
                <v-col cols="3" sm="4" class="text-right d-none d-sm-block"><v-icon>mdi-antenna</v-icon></v-col>
            </v-row>
        </div>
        <airport-top-list v-if="firs" :firs="firs.map((f) => f.icao)" class="mt-2" />
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
        </div>
        <div v-if="firs && firs.length > 0" class="mt-5">
            <div class="text-grey-lighten-1 pa-1 mb-2" style="background: #313338">FIRs</div>
            <v-row no-gutters>
                <v-col cols="12" sm="4" v-for="fir in firs" :key="fir.icao" @click="router.push(`/fir/${fir.icao}`)" class="fir pa-1 text-truncate">
                    {{ fir.icao }} <span class="text-grey-lighten-1 text-body-2">{{ fir.name }}</span>
                </v-col>
            </v-row>
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
import AirportTopList from "@/components/AirportTopList.vue"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()

const id = computed(() => (route.params.id as string).toUpperCase())

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
            c.callsign.endsWith("_CTR") &&
            !c.callsign.endsWith("_OBS") &&
            ((c.callsign.startsWith(id.value) && c.callsign[4] == "_") || callsignPrefixes.find((prefix) => c.callsign.startsWith(prefix)))
    )
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
                ((b.callsign.endsWith("_CTR") &&
                    ((b.callsign.startsWith(id.value) && b.callsign[4] == "_") ||
                        callsignPrefixes.find((prefix) => b.callsign.startsWith(prefix)))) ||
                    (!b.callsign.endsWith("_CTR") && isAirportCallsign(b.callsign)))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)))
})

function isAirportCallsign(callsign: string) {
    const airport = vatsim.airportByIcao[callsign.substring(0, 4)]
    if (airport && airport.fir && airport.fir.startsWith(id.value)) return true
    return false
}
</script>
