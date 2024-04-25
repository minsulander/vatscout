<template>
    <v-row v-if="!compact" no-gutters class="text-grey-lighten-1 pa-1" style="background: #313338">
        <v-col sm="7" class=""><v-icon class="mr-1">mdi-airplane-landing</v-icon>Arrivals</v-col>
        <v-col sm="5" class="text-right">
            <span v-if="arrivalPrefiles.length > 0" class="text-grey ml-3">{{ arrivalPrefiles.length }}</span>
            <span v-if="arrivingPilots.length > 0" class="text-yellow-lighten-2 ml-3">{{ arrivingPilots.length }}</span>
            <span v-if="arrivedPilots.length > 0" class="text-brown-lighten-1 ml-3">{{ arrivedPilots.length }}</span>
        </v-col>
    </v-row>
    <div v-if="!props.compact && arrivalPrefiles.length > 0">
        <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1">PREFILED</div>
        <flight-row
            v-for="p in arrivalPrefiles"
            :key="p.callsign"
            :value="p"
            arrival
            prefile
            :class="newArrivals.includes(p.callsign) ? 'bg-brown-darken-3' : ''"
            @click="emit('click', p.callsign)"
        />
    </div>
    <div v-if="arrivingPilots.length > 0">
        <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact">ARRIVING</div>
        <flight-row
            v-for="p in arrivingPilots"
            :key="p.callsign"
            :value="p"
            arrival
            :class="newArrivals.includes(p.callsign) ? 'bg-brown-darken-3' : ''"
            @click="emit('click', p.callsign)"
        />
    </div>
    <div v-if="arrivedPilots.length > 0">
        <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact">ARRIVED</div>
        <flight-row v-for="p in arrivedPilots" :key="p.callsign" :value="p" arrival @click="emit('click', p.callsign)" />
    </div>
    <div
        v-if="(arrivalPrefiles.length == 0 || props.compact) && arrivingPilots.length == 0 && arrivedPilots.length == 0"
        class="text-center text-caption text-grey-darken-1 font-weight-light pa-1"
    >
        NO ARRIVALS WITHIN {{ minutes2hhmm(settings.arrivingMaxMinutes) }}
    </div>
</template>
<script setup lang="ts">
import { arrivalDistance, departureDistance, eta, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import { minutes2hhmm } from "@/common"
import FlightRow from "@/components/FlightRow.vue"
import constants from "@/constants"
import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed, ref, watch } from "vue"

const props = defineProps({
    compact: {
        type: Boolean,
    },
    icao: {
        type: String,
        required: true,
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
            const etaA = eta(a) || flightplanArrivalTime(a.flight_plan, true)
            const etaB = eta(b) || flightplanArrivalTime(b.flight_plan, true)
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

const arrivalCallsigns = () => arrivingPilots.value.map((p) => p.callsign)
let lastArrivals = vatsim.data && vatsim.data.pilots && vatsim.data.prefiles ? arrivalCallsigns() : undefined
const newArrivals = ref([] as string[])
let debounceTimeout: any = undefined

watch(arrivingPilots, () => {
    if (debounceTimeout) clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
        debounceTimeout = undefined
        let popups = []
        const allArrivals = arrivalCallsigns()
        if (typeof lastArrivals != "undefined") {
            for (const callsign of allArrivals) {
                if (!lastArrivals.includes(callsign)) popups.push(callsign)
            }
        }
        if (popups.length > 0) console.log("wtf", popups, lastArrivals)
        lastArrivals = allArrivals
        newArrivals.value = popups
        if (popups.length > 0) setTimeout(() => (newArrivals.value = []), 10000)
    }, 300)
})
</script>
