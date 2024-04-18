<template>
    <v-row no-gutters class="text-grey-lighten-1 pa-1" style="background: #313338">
        <v-col sm="7" class=""><v-icon class="mr-1">mdi-airplane-landing</v-icon>Arrivals</v-col>
        <v-col sm="5" class="text-right">
            <span v-if="arrivalPrefiles.length > 0" class="text-grey ml-3">{{ arrivalPrefiles.length }}</span>
            <span v-if="arrivingPilots.length > 0" class="text-yellow-lighten-2 ml-3">{{ arrivingPilots.length }}</span>
            <span v-if="arrivedPilots.length > 0" class="text-brown-lighten-1 ml-3">{{ arrivedPilots.length }}</span>
        </v-col>
    </v-row>
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="arrivalPrefiles.length > 0">PREFILED</div>
    <flight-row
        v-for="p in arrivalPrefiles"
        :key="p.callsign"
        :value="p"
        arrival
        prefile
        :class="newArrivals.includes(p.callsign) ? 'bg-brown-darken-3' : ''"
        @click="emit('click', p.callsign)"
    />
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="arrivingPilots.length > 0">ARRIVING</div>
    <flight-row
        v-for="p in arrivingPilots"
        :key="p.callsign"
        :value="p"
        arrival
        :class="newArrivals.includes(p.callsign) ? 'bg-brown-darken-3' : ''"
        @click="emit('click', p.callsign)"
    />
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="arrivedPilots.length > 0">ARRIVED</div>
    <flight-row v-for="p in arrivedPilots" :key="p.callsign" :value="p" arrival @click="emit('click', p.callsign)" />
    <div
        v-if="arrivalPrefiles.length == 0 && arrivingPilots.length == 0 && arrivedPilots.length == 0"
        class="mt-2 text-caption text-grey-darken-1 font-weight-light text-center"
    >
        NO ARRIVALS WITHIN {{ minutes2hhmm(settings.arrivingMaxMinutes) }}
    </div>
</template>
<script setup lang="ts">
import { arrivalDistance, departureDistance, distanceToAirport, eta, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import { compareCallsigns, compareControllers, extractAtisCode } from "@/common"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import DepartureList from "@/components/DepartureList.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import FlightRow from "@/components/FlightRow.vue"
import constants from "@/constants"
import { useSettingsStore } from "@/store/settings"
import { Atis, useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify"
import { minutes2hhmm } from "@/common"

const props = defineProps({
    icao: {
        type: String,
        required: true,
    },
    newArrivals: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(["click"])

const vatsim = useVatsimStore()
const settings = useSettingsStore()

const id = computed(() => props.icao)
const airport = computed(() => vatsim.airportByIcao[id.value])

const arrivingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => {
            if (!p.flight_plan || p.flight_plan.arrival != id.value || p.flight_plan.departure == id.value) return false
            const departed = p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance
            const etaOrArrivalTime = eta(p) || flightplanArrivalTime(p.flight_plan, !departed)
            return (
                (p.groundspeed >= constants.inflightGroundspeed || arrivalDistance(p) >= constants.atAirportDistance) &&
                (!etaOrArrivalTime || etaOrArrivalTime.isBefore(moment().add(settings.arrivingMaxMinutes, "minute")))
            )
        })
        .sort((a, b) => {
            const etaA = eta(a) || flightplanArrivalTime(a.flight_plan)
            const etaB = eta(b) || flightplanArrivalTime(b.flight_plan)
            if (etaA && etaB) return etaA.diff(etaB)
            else if (etaA) return -1
            else if (etaB) return 1
            else return a.callsign.localeCompare(b.callsign)
        })
})
const arrivedPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots.filter(
        (p) =>
            p.flight_plan &&
            p.flight_plan.arrival == id.value &&
            p.flight_plan.departure != id.value &&
            p.groundspeed < constants.inflightGroundspeed &&
            arrivalDistance(p) < constants.atAirportDistance
    )
})
const arrivalPrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.arrival == id.value &&
                p.flight_plan.departure != id.value &&
                (!flightplanArrivalTime(p.flight_plan) ||
                    flightplanArrivalTime(p.flight_plan)?.isBefore(moment().add(settings.arrivingMaxMinutes, "minute"))) &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")))
        )
        .sort((a, b) => {
            const arrivalTimeA = flightplanArrivalTime(a.flight_plan)
            const arrivalTimeB = flightplanArrivalTime(b.flight_plan)
            if (arrivalTimeA && arrivalTimeB) return arrivalTimeA.diff(arrivalTimeB)
            return moment(a.last_updated).diff(b.last_updated)
        })
})
</script>