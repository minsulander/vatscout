<template>
    <v-container>
        <v-row>
            <v-col cols="4">
                <div class="text-h3">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="fir" class="mt-3">
                    {{ fir.name }}<span v-if="fir.callsignPrefix"> | {{ fir.callsignPrefix }}</span> |
                    <router-link :to="`/country/${id.substring(0, 2)}`" class="pa-1">{{ id.substring(0, 2) }}</router-link>
                </div>
            </v-col>
        </v-row>
        <div v-if="fir">
            
        </div>
        <v-row class="mt-2">
            <v-col sm="3" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ controller.callsign }}
                </v-chip>
                {{ controller.frequency }}<br />{{ controller.name }}
                <span class="text-grey">{{ moment.utc(moment().diff(moment(controller.logon_time))).format("HHmm") }}</span>
            </v-col>
        </v-row>
        <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mt-5 mb-2">
            <v-row>
                <v-col cols="6" sm="6">Active airports </v-col>
                <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-takeoff</v-icon></v-col>
                <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-landing</v-icon></v-col>
                <v-col cols="3" sm="4" class="text-right d-none d-sm-block"><v-icon>mdi-antenna</v-icon></v-col>
            </v-row>
        </div>
        <airport-top-list :fir="id" class="mt-2" />
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mb-2">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import { colorForController, compareControllers, labelForController } from "@/common"
import AirportTopList from "@/components/AirportTopList.vue"
import Booking from "@/components/Booking.vue"
import moment from "moment"
import { useSettingsStore } from "@/store/settings"
const route = useRoute()
const vatsim = useVatsimStore()
const settings = useSettingsStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const fir = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == id.value)
})

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter((c) => isMatchingCallsign(c.callsign)).sort(compareControllers)
})

const bookings = computed(() => {
    if (!vatsim.bookings) return []
    return vatsim.bookings
        .filter(
            (b) =>
                isMatchingCallsign(b.callsign) /* || isAirportCallsign(b.callsign)*/ &&
                moment(b.start) &&
                moment(b.start).utc().isBefore(moment().add(settings.bookingsMaxHours, "hour"))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)))
})

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        (callsign.startsWith(`${id.value}_`) ||
            (fir.value && fir.value.callsignPrefix && callsign.startsWith(fir.value.callsignPrefix)) ||
            (id.value.startsWith("K") && callsign.startsWith(`${id.value.substring(1)}_`)))
    )
}

// extracting bookings for airports this way on FIR / country pages takes too long...
function isAirportCallsign(callsign: string) {
    if (!fir.value) return false
    const airport = vatsim.airportByIcao[callsign.substring(0, 4)]
    if (airport && airport.fir == fir.value.icao) return true
    return false
}
</script>
