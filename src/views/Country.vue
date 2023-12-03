<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="country">
            {{ country.name }}
            {{ country.facility }}
        </div>
        <v-row class="mt-2">
            <v-col sm="3" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ controller.callsign }}
                </v-chip>
                {{ controller.frequency }}<br />{{ controller.name }}
            </v-col>
        </v-row>
        <div class="bg-grey-darken-4 pa-1 mt-5 mb-2">Active airports</div>
        <airport-top-list v-if="firs" :firs="firs.map((f) => f.icao)" class="mt-2" />
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="bg-grey-darken-4 pa-1 mb-2">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" class="mt-1" />
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import { colorForController } from "@/common"
import AirportTopList from "@/components/AirportTopList.vue"
import Booking from "@/components/Booking.vue"
import moment from "moment"
import { useSettingsStore } from "@/store/settings"
const route = useRoute()
const vatsim = useVatsimStore()
const settings = useSettingsStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const country = computed(() => {
    return vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find((c) => c.prefix == id.value)
})

const firs = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.filter((f) => f.icao.startsWith(id.value))
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
