<template>
    <v-container>
        <v-row>
            <v-col sm="4">
                <div class="text-h3">{{ id }}</div>
            </v-col>
            <v-col sm="8" class="text-right">
                <div v-if="airport" class="mt-3">
                    <span v-if="airport.iata">{{ airport.iata }} | </span>
                    {{ airport.name }} | {{ airport.fir }}
                </div>
            </v-col>
        </v-row>
        <v-row>
            <v-col sm="6" v-for="atis in atises">
                <v-chip variant="flat" elevated label size="small" color="yellow-darken-4" class="text-white font-weight-bold mb-1"
                    >{{ atis.atis_code }}
                </v-chip>
                {{ atis.frequency }} {{ atis.callsign.replace(`${id}_`, "") }}<br />
                <div class="text-caption text-grey">
                    {{ atis.text_atis?.join("\n") }}
                </div>
            </v-col>
            <v-col sm="3" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ labelForController(controller) }}
                </v-chip>
                {{ controller.frequency }}<br />{{ controller.name }}
            </v-col>
        </v-row>
        <v-row class="mt-3">
            <v-col sm="6">
                <v-row no-gutters class="bg-grey-darken-4 pa-1">
                    <v-col sm="3">Departures</v-col>
                    <v-col sm="9" class="text-right">
                        <span v-if="departurePrefiles.length > 0" class="text-grey mr-3">{{ departurePrefiles.length }}</span>
                        <span>{{ departingPilots.length }}</span>
                        <span v-if="departedPilots.length > 0" class="text-blue ml-3">{{ departedPilots.length }}</span>
                    </v-col>
                </v-row>
                <flight-row v-for="p in departurePrefiles" :key="p.callsign" :value="p" departure prefile />
                <flight-row v-for="p in departingPilots" :key="p.callsign" :value="p" departure />
                <flight-row v-for="p in departedPilots" :key="p.callsign" :value="p" departure />
            </v-col>
            <v-col sm="6">
                <v-row no-gutters class="bg-grey-darken-4 pa-1">
                    <v-col sm="3" class="">Arrivals</v-col>
                    <v-col sm="9" class="text-right">
                        <span v-if="arrivalPrefiles.length > 0" class="text-grey mr-3">{{ arrivalPrefiles.length }}</span>
                        <span>{{ arrivingPilots.length }}</span>
                        <span v-if="arrivedPilots.length > 0" class="text-brown ml-3">{{ arrivedPilots.length }}</span>
                    </v-col>
                </v-row>
                <flight-row v-for="p in arrivalPrefiles" :key="p.callsign" :value="p" arrival prefile />
                <flight-row v-for="p in arrivingPilots" :key="p.callsign" :value="p" arrival />
                <flight-row v-for="p in arrivedPilots" :key="p.callsign" :value="p" arrival />
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import constants from "@/constants"
import { colorForController, compareControllers, labelForController } from "@/common"
import { eta, departureDistance, arrivalDistance } from "@/calc"
import FlightRow from "@/components/FlightRow.vue"
const moment = inject("moment")
const route = useRoute()
const vatsim = useVatsimStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const airport = computed(() => {
    return vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == id.value && !a.pseudo)
})

const departedPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => p.flight_plan && p.flight_plan.departure == id.value && (p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance))
        .sort((a, b) => eta(b) - eta(a))
})
const departingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => p.flight_plan && p.flight_plan.departure == id.value && p.groundspeed < constants.inflightGroundspeed && departureDistance(p) < constants.atAirportDistance)
        .sort((a, b) => a.flight_plan.deptime.localeCompare(b.flight_plan.deptime))
})
const departurePrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles
        .filter((p) => p.flight_plan && p.flight_plan.departure == id.value)
        .sort((a, b) => a.flight_plan.deptime.localeCompare(b.flight_plan.deptime))
})
const arrivingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => p.flight_plan && p.flight_plan.arrival == id.value && (p.groundspeed >= constants.inflightGroundspeed || arrivalDistance(p) >= constants.atAirportDistance))
        .sort((a, b) => eta(a) - eta(b))
})
const arrivedPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots.filter(
        (p) => p.flight_plan && p.flight_plan.arrival == id.value && p.groundspeed < constants.inflightGroundspeed && arrivalDistance(p) < constants.atAirportDistance
    )
})
const arrivalPrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.arrival == id.value)
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
        .filter(
            (c) =>
                (c.callsign &&
                    !c.callsign.endsWith("_CTR") &&
                    (c.callsign.startsWith(`${id.value}_`) ||
                        (id.value.startsWith("K") && c.callsign.startsWith(`${id.value.substring(1)}_`)))) ||
                (c.callsign.endsWith("_CTR") && airport.value && c.callsign.startsWith(`${airport.value.fir}_`)) ||
                (c.callsign.endsWith("_CTR") &&
                    fir.value &&
                    fir.value.callsignPrefix &&
                    c.callsign.startsWith(`${fir.value.callsignPrefix}_`))
        )
        .sort(compareControllers)
})
</script>
