<template>
    <v-container>
        <v-row>
            <v-col cols="4">
                <div class="text-h3">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="country" class="mt-3">
                    {{ country.name }}
                    {{ country.facility }}
                </div>
            </v-col>
        </v-row>
        <v-row class="mt-2">
            <v-col sm="3" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ controller.callsign }}
                </v-chip>
                {{ controller.frequency }}<br />{{ controller.name }}
                <span class="text-grey">{{ moment.utc(moment().diff(moment(controller.logon_time))).format("HHmm") }}</span>
            </v-col>
        </v-row>
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mb-2">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
        </div>
        <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mt-5 mb-2">
            <v-row>
                <v-col cols="6" sm="6">Active airports </v-col>
                <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-takeoff</v-icon></v-col>
                <v-col cols="3" sm="1" class="text-center"><v-icon>mdi-airplane-landing</v-icon></v-col>
                <v-col cols="3" sm="4" class="text-right d-none d-sm-block"><v-icon>mdi-antenna</v-icon></v-col>
            </v-row>
        </div>
        <airport-top-list v-if="firs" :firs="firs.map((f) => f.icao)" class="mt-2" />
        <div v-if="firs.length > 0" class="mt-5">
            <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mb-2">FIRs</div>
            <v-row>
                <v-col cols="12" sm="4" v-for="fir in firs" @click="router.push(`/fir/${fir.icao}`)" class="fir">
                    {{ fir.icao }} <span class="text-grey-lighten-1 text-body-2">{{ fir.name }}</span>
                </v-col>
            </v-row>
        </div>
    </v-container>
</template>

<style>
.fir:hover {
    background: #333;
    cursor: pointer;
}
</style>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import { colorForController } from "@/common"
import { useRouter } from "vue-router"
import AirportTopList from "@/components/AirportTopList.vue"
import Booking from "@/components/Booking.vue"
import moment from "moment"
import { useSettingsStore } from "@/store/settings"
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
        vatsim.spy.firs.filter((f) => f.icao.startsWith(id.value)).sort((a, b) => a.icao.localeCompare(b.icao))
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
            c.callsign &&
            c.callsign.endsWith("_CTR") &&
            (c.callsign.startsWith(id.value) || callsignPrefixes.find((prefix) => c.callsign.startsWith(prefix)))
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
                b.callsign &&
                b.callsign.endsWith("_CTR") &&
                (b.callsign.startsWith(id.value) || callsignPrefixes.find((prefix) => b.callsign.startsWith(prefix))) &&
                moment(b.start) &&
                moment(b.start).utcOffset(0).isBefore(moment().add(settings.bookingsMaxHours, "hour"))
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)))
})
</script>
