<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="airport">
            {{ airport.iata }} | {{ airport.name }} |
            {{ airport.latitude }} {{ airport.longitude }} |
            {{ airport.fir }} | {{ airport.pseudo }}
        </div>
        <v-row no-gutters>
            <v-col sm="3" class="label">Departures</v-col>
            <v-col sm="9" class="value">{{ departurePilots.length }} / {{ departurePrefiles.length }}</v-col>
        </v-row>
        <v-row no-gutters>
            <v-col sm="3" class="label">Arrivals</v-col>
            <v-col sm="9" class="value">{{ arrivalPilots.length }} / {{ arrivalPrefiles.length }}</v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
const moment = inject("moment")
const route = useRoute()
const vatsim = useVatsimStore()

const id = (route.params.id as string).toUpperCase()

const airport = computed(() => {
    return vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == id)
})

const departurePilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots.filter((p) => p.flight_plan && p.flight_plan.departure == id)
})
const departurePrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.departure == id)
})
const arrivalPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots.filter((p) => p.flight_plan && p.flight_plan.arrival == id)
})
const arrivalPrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.arrival == id)
})
</script>
