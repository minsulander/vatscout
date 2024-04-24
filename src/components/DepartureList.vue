<template>
    <v-row v-if="!props.compact" no-gutters class="text-grey-lighten-1 pa-1" style="background: #313338">
        <v-col sm="7"><v-icon class="mr-1">mdi-airplane-takeoff</v-icon>Departures</v-col>
        <v-col sm="5" class="text-right">
            <span v-if="departurePrefiles.length > 0" class="text-grey ml-3">{{ departurePrefiles.length }}</span>
            <span v-if="nofpPilots.length > 0" class="text-grey-lighten-1 ml-3">{{ nofpPilots.length }}</span>
            <span v-if="invalidfpPilots.length > 0" class="text-error ml-3">{{ invalidfpPilots.length }}</span>
            <span v-if="departingPilots.length > 0" class="text-cyan-lighten-2 ml-3">{{ departingPilots.length }}</span>
            <span v-if="departedPilots.length > 0" class="text-cyan-darken-3 ml-3">{{ departedPilots.length }}</span>
        </v-col>
    </v-row>
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact && departurePrefiles.length > 0">
        PREFILED
    </div>
    <flight-row
        v-for="p in departurePrefiles"
        :key="p.callsign"
        :value="p"
        departure
        prefile
        :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
        @click="emit('click', p.callsign)"
    />
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact && nofpPilots.length > 0">
        NO FLIGHTPLAN
    </div>
    <flight-row
        v-for="p in nofpPilots"
        :key="p.callsign"
        :value="p"
        departure
        nofp
        :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
        @click="emit('click', p.callsign)"
    />
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact && invalidfpPilots.length > 0">
        INVALID FLIGHTPLAN
    </div>
    <flight-row
        v-for="p in invalidfpPilots"
        :key="p.callsign"
        :value="p"
        departure
        invalid
        :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
        @click="emit('click', p.callsign)"
    />
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact && departingPilots.length > 0">
        DEPARTING
    </div>
    <flight-row
        v-for="p in departingPilots"
        :key="p.callsign"
        :value="p"
        departure
        :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
        @click="emit('click', p.callsign)"
    />
    <div class="text-caption text-grey-darken-1 font-weight-light mt-2 ml-1" v-if="!props.compact && departedPilots.length > 0">
        DEPARTED
    </div>
    <flight-row v-for="p in departedPilots" :key="p.callsign" :value="p" departure @click="emit('click', p.callsign)" />
    <div
        v-if="
            departurePrefiles.length == 0 &&
            nofpPilots.length == 0 &&
            invalidfpPilots.length == 0 &&
            departingPilots.length == 0 &&
            departedPilots.length == 0
        "
        class="text-center text-caption text-grey-darken-1 font-weight-light pa-1"
    >
        NO DEPARTURES
    </div>
</template>
<script setup lang="ts">
import { departureDistance, distanceToAirport, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import constants from "@/constants"
import FlightRow from "@/components/FlightRow.vue"
import { computed, ref, watch } from "vue"
import { useVatsimStore } from "@/store/vatsim"
import { useSettingsStore } from "@/store/settings"
import moment from "moment"

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

const departedPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                (p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance) &&
                departureDistance(p) < settings.departedMaxRange
        )
        .sort((a, b) => departureDistance(a) - departureDistance(b))
})
const departingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                p.groundspeed < constants.inflightGroundspeed &&
                departureDistance(p) < constants.atAirportDistance
        )
        .sort((a, b) => a.flight_plan.deptime.localeCompare(b.flight_plan.deptime))
})
const nofpPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                !p.flight_plan &&
                distanceToAirport(p, airport.value) < constants.atAirportDistance &&
                p.groundspeed < constants.motionGroundspeed
        )
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})
const invalidfpPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure != id.value &&
                p.flight_plan.arrival != id.value &&
                p.flight_plan.alternate != id.value &&
                distanceToAirport(p, airport.value) < constants.atAirportDistance &&
                p.groundspeed < constants.motionGroundspeed
        )
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})
const departurePrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    (flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")) &&
                        flightplanDepartureTime(p.flight_plan)?.isBefore(moment().add(settings.prefileDepartureMaxMinutes, "minute"))))
        )
        .sort((a, b) => flightplanArrivalTime(a.flight_plan)?.diff(flightplanArrivalTime(b.flight_plan)) || 0)
})

const departures = computed(() => [...departurePrefiles.value, ...nofpPilots.value, ...invalidfpPilots.value, ...departingPilots.value])
const departureCallsigns = () => departures.value.map((p) => p.callsign)
let lastDepartures = vatsim.data.pilots ? departureCallsigns() : undefined
const newDepartures = ref([] as string[])

watch(departures, () => {
    let popups = []
    const allDepartures = departureCallsigns()
    if (typeof lastDepartures != "undefined") {
        for (const callsign of allDepartures) {
            if (!lastDepartures.includes(callsign)) popups.push(callsign)
        }
    }
    lastDepartures = allDepartures
    newDepartures.value = popups
    if (popups.length > 0) setTimeout(() => (newDepartures.value = []), 10000)
})
</script>
