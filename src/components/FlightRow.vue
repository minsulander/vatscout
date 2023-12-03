<template>
    <v-row no-gutters :class="rowclass" @click="click" class="px-1" v-if="value && value.flight_plan">
        <v-col sm="3" v-if="!hideIcao">
            {{ value.callsign }}
        </v-col>
        <v-col sm="3">
            {{ value.flight_plan.aircraft_short }}
        </v-col>
        <v-col sm="3">
            <span v-if="!departure">
                {{ value.flight_plan.departure }}
            </span>
            <span v-if="!arrival">
                <span v-if="!departure"> - </span>
                {{ value.flight_plan.arrival }}
            </span>
        </v-col>
        <v-col sm="3">
            <!-- TODO for prefiles, show time since last updated -->
            <span v-if="arrival && eta">
                {{ moment(eta).utcOffset(0).format("HHmm") }}
            </span>
            <span v-else-if="departure && (pending || prefile) && value.flight_plan.deptime && value.flight_plan.deptime != '0000'">
                {{ value.flight_plan.deptime }}
            </span>
            <span v-else-if="arrival && pending && flightplanArrivalTime(value.flight_plan)" style="opacity: 0.5">
                {{ flightplanArrivalTime(value.flight_plan)!.format("HHmm") }}
            </span>
            <v-chip size="small" label class="float-right" v-if="value.flight_plan.flight_rules == 'V'">VFR</v-chip>
        </v-col>
    </v-row>
</template>

<style scoped>
.v-row:hover {
    background: rgba(200, 200, 200, 0.2);
    cursor: pointer;
}
</style>

<script setup lang="ts">
import constants from "@/constants"
import { Pilot, Prefile } from "@/store/vatsim"
import { computed, inject } from "vue"
import * as calc from "@/calc"
import { useRouter } from "vue-router"
import { flightplanArrivalTime } from "@/calc"
import moment from "moment"
const router = useRouter()
const props = defineProps<{ value: Pilot | Prefile; departure?: boolean; arrival?: boolean; prefile?: boolean; hideIcao?: boolean }>()

const pending = computed(() => {
    const pilot = props.value as Pilot
    if (!pilot) return false
    return (
        (props.departure && pilot.groundspeed < constants.inflightGroundspeed && calc.departureDistance(pilot) < constants.atAirportDistance) ||
        (props.arrival && (pilot.groundspeed >= constants.inflightGroundspeed || calc.arrivalDistance(pilot) >= constants.atAirportDistance))
    )
})
const eta = computed(() => calc.eta(props.value as Pilot))

const rowclass = computed(() => {
    if (props.prefile) return "text-grey"
    if (props.departure && !pending.value) return "text-cyan-darken-3"
    if (props.arrival && !pending.value) return "text-brown-lighten-1"
    if (props.departure) return "text-cyan-lighten-2"
    if (props.arrival) return "text-yellow-lighten-2"
    return ""
})

function click() {
    router.push(`/flight/${props.value.callsign}`)
}
</script>
