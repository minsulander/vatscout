<template>
    <v-row no-gutters :class="rowclass" @click="click" class="px-1" v-if="value" style="font-family: monospace">
        <v-col sm="3" v-if="!hideIcao">
            <span>{{ value.callsign }}</span>
        </v-col>
        <v-col sm="3" v-if="value.flight_plan">
            <span>{{ value.flight_plan.aircraft_short }}</span>
            <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="typeClass && typeClass == 'H'"><v-icon>mdi-helicopter</v-icon></v-chip>
            <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-else-if="wtc && wtc != 'M'">{{ wtc }}</v-chip>
        </v-col>
        <v-col sm="2" v-if="value.flight_plan">
            <span v-if="!departure">
                {{ value.flight_plan.departure }}
            </span>
            <span v-if="!arrival">
                <span v-if="!departure"> - </span>
                {{ value.flight_plan.arrival }}
            </span>
        </v-col>
        <v-col sm="4" v-if="value.flight_plan">
            <span v-if="arrival && eta">
                {{ moment(eta).utc().format("HHmm") }}
            </span>
            <span v-else-if="departure && (pending || prefile) && value.flight_plan.deptime && value.flight_plan.deptime != '0000'">
                {{ value.flight_plan.deptime }}
            </span>
            <span v-else-if="arrival && pending && flightplanArrivalTime(value.flight_plan, true)" style="opacity: 0.5">
                {{ flightplanArrivalTime(value.flight_plan, true)!.format("HHmm") }}
            </span>
            <div class="float-right text-nowrap">
                <!--<v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="t1">T1</v-chip>-->
                <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="value.flight_plan.flight_rules == 'V'">VFR</v-chip>
                <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="newPilot">NEW</v-chip>
                <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="streamer"><v-icon>mdi-video</v-icon></v-chip>
                <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="textOnly">T</v-chip>
                <v-chip size="small" density="comfortable" label class="ml-1 px-1" v-if="receiveOnly">R</v-chip>
                <v-chip size="small" density="comfortable" label class="ml-1 px-1" color="red" v-if="departure && pending && transponderWarning">{{ transponderWarning }}</v-chip>
            </div>
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
import * as calc from "@/calc"
import { flightplanArrivalTime } from "@/calc"
import constants from "@/constants"
import actypecodes from "@/data/actypecodes.json"
import { Pilot, Prefile } from "@/store/vatsim"
import moment from "moment"
import { computed } from "vue"

const props = defineProps<{
    value: Pilot | Prefile
    departure?: boolean
    arrival?: boolean
    prefile?: boolean
    nofp?: boolean
    invalid?: boolean
    hideIcao?: boolean
}>()
const emit = defineEmits(["click"])

const actypeCode = computed(() => props.value.flight_plan && (actypecodes as any)[props.value.flight_plan.aircraft_short])
const typeClass = computed(() => actypeCode.value && actypeCode.value[1])
const wtc = computed(() => actypeCode.value && actypeCode.value[0])

const pending = computed(() => {
    const pilot = props.value as Pilot
    if (!pilot) return false
    return (
        (props.departure &&
            pilot.groundspeed < constants.inflightGroundspeed &&
            calc.departureDistance(pilot) < constants.atAirportDistance) ||
        (props.arrival &&
            (pilot.groundspeed >= constants.inflightGroundspeed || calc.arrivalDistance(pilot) >= constants.atAirportDistance))
    )
})
const eta = computed(() => calc.eta(props.value as Pilot))

const rowclass = computed(() => {
    if (props.prefile) return "text-grey"
    if (props.nofp) return "text-grey-lighten-1"
    if (props.invalid) return "text-error"
    if (props.departure && !pending.value) return "text-cyan-darken-3"
    if (props.arrival && !pending.value) return "text-brown-lighten-1"
    if (props.departure) return "text-cyan-lighten-2"
    if (props.arrival) return "text-yellow-lighten-2"
    return ""
})

const transponderWarning = computed(() => {
    const pilot = props.value as Pilot
    if (!pilot) return false
    if (!pilot.flight_plan) return false
    if (pilot.transponder == pilot.flight_plan.assigned_transponder) return false
    if (["0000", "1000", "1200"].includes(pilot.flight_plan.assigned_transponder)) return false
    return pilot.flight_plan.assigned_transponder
})

const newPilot = computed(() => {
    const flightplan = props.value.flight_plan
    if (!flightplan) return false
    if (!flightplan.remarks) return false
    for (const phrase of constants.newPilotPhrases) if (flightplan.remarks.includes(phrase)) return true
    return false
})

/*
const t1 = computed(() => {
    const flightplan = props.value.flight_plan
    if (!flightplan) return false
    if (!flightplan.remarks) return false
    return !!flightplan.remarks.match(/PBN\/\w+T1/)
})
*/

const textOnly = computed(() => {
    const flightplan = props.value.flight_plan
    if (!flightplan) return false
    if (!flightplan.remarks) return false
    return !!flightplan.remarks.toUpperCase().includes("/T/")
})

const receiveOnly = computed(() => {
    const flightplan = props.value.flight_plan
    if (!flightplan) return false
    if (!flightplan.remarks) return false
    return !!flightplan.remarks.toUpperCase().includes("/R/")
})

const streamer = computed(() => {
    const flightplan = props.value.flight_plan
    if (!flightplan) return false
    if (!flightplan.remarks) return false
    return !!flightplan.remarks.toUpperCase().match(/TWITCH.TV|STREAM(ING?).*TWITCH|LIVE( ON?).*TWITCH/)
})

function click() {
    //router.push(`/flight/${props.value.callsign}`)
    emit("click", props.value.callsign)
}
</script>
