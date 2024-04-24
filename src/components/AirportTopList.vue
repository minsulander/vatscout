<template>
    <div>
        <div v-if="activeAirports.length == 0" class="mt-2 text-caption text-grey-darken-1 font-weight-light text-center">
            NO DEPARTURES, ARRIVALS OR CONTROLLERS ACTIVE
        </div>
        <v-row v-for="airport in activeAirports" :key="airport.icao" no-gutters class="pa-1" @click="clickAirport(airport)">
            <v-col cols="6" sm="1">
                {{ airport.icao }}
            </v-col>
            <v-col sm="5" class="d-none d-sm-block text-grey-lighten-1">{{ airport.name }} </v-col>
            <v-col cols="3" sm="1" class="text-center">
                <!--
                <span v-if="vatsim.movements[airport.icao].prefiledDepartures" class="text-grey mr-3">{{
                    vatsim.movements[airport.icao].prefiledDepartures
                }}</span>
                <span v-if="vatsim.movements[airport.icao].nofp" class="text-grey-lighten-1 mr-3">{{
                    vatsim.movements[airport.icao].nofp
                }}</span>
                <span v-if="vatsim.movements[airport.icao].invalidfp" class="text-error mr-3">{{
                    vatsim.movements[airport.icao].invalidfp
                }}</span>
                <span v-if="vatsim.movements[airport.icao].departing" class="text-cyan-lighten-2">{{
                    vatsim.movements[airport.icao].departing
                }}</span>
                <span v-if="vatsim.movements[airport.icao].departed" class="text-cyan-darken-3 ml-3">{{
                    vatsim.movements[airport.icao].departed
                }}</span>
                -->
                <span v-if="vatsim.movements[airport.icao].activeDepartures" class="text-cyan-lighten-2">{{
                    vatsim.movements[airport.icao].activeDepartures
                }}</span>
            </v-col>
            <v-col cols="3" sm="1" class="text-center">
                <span v-if="vatsim.movements[airport.icao].activeArrivals" class="text-yellow-lighten-2">{{
                    vatsim.movements[airport.icao].activeArrivals
                }}</span>
                <!--
                <span v-if="vatsim.movements[airport.icao].prefiledArrivals" class="text-grey mr-3">{{
                    vatsim.movements[airport.icao].prefiledArrivals
                }}</span>
                <span v-if="vatsim.movements[airport.icao].arriving" class="text-yellow-lighten-2">{{
                    vatsim.movements[airport.icao].arriving
                }}</span>
                <span v-if="vatsim.movements[airport.icao].arrived" class="text-brown-lighten-1 ml-3">{{
                    vatsim.movements[airport.icao].arrived
                }}</span>
                -->
            </v-col>
            <v-col sm="6" class="d-sm-none text-body-2 text-grey mt-1">{{ airport.name }} </v-col>
            <v-col cols="6" sm="4" class="text-right">
                <Atis compact v-for="atis in atises(airport)" :key="atis.callsign" :value="atis" class="ml-1 mt-1" />
                <Controller compact v-for="controller in controllers(airport)" :key="controller.callsign" :value="controller" class="ml-1 mt-1" />
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
.v-row:hover {
    background: #333;
    cursor: pointer;
}
</style>

<script setup lang="ts">
import { Airport, useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import { colorForController, labelForController, compareControllers, extractAtisCode } from "@/common"
import { useRouter } from "vue-router"
import Atis from "@/components/Atis.vue"
import Controller from "./Controller.vue"
const vatsim = useVatsimStore()
const router = useRouter()
const props = defineProps<{ firs?: string[]; fir?: string }>()

const firs = computed(() => (props.firs ? props.firs : [props.fir]))

function atises(airport: Airport) {
    if (!vatsim.data.atis) return []
    return vatsim.data.atis
        .filter((c) => c.callsign && c.callsign.startsWith(`${airport.icao}_`))
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
}

function controllers(airport: Airport) {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers
        .filter(
            (c) =>
                c.callsign &&
                !c.callsign.endsWith("_CTR") &&
                (c.callsign.startsWith(`${airport.icao}_`) ||
                    (airport.icao.startsWith("K") && c.callsign.startsWith(`${airport.icao.substring(1)}_`)))
        )
        .sort(compareControllers)
}

const activeAirports = computed(() => {
    if (!vatsim.spy.airports) return []
    return vatsim.spy.airports
        .filter((a) => {
            if (a.pseudo || !firs.value.includes(a.fir)) return false
            if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
            if (vatsim.movements[a.icao].active > 0) return true
            if (vatsim.data.controllers && vatsim.data.controllers.find(c => isMatchingCallsign(c.callsign, a))) return true
        })
        .sort((a, b) => {
            if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
            if (!(b.icao in vatsim.movements)) vatsim.movements[b.icao] = vatsim.countMovements(b.icao)
            const acount = vatsim.movements[a.icao].active
            const bcount = vatsim.movements[b.icao].active
            return acount >= bcount ? -1 : 1
        })
})

function isMatchingCallsign(callsign: string, airport: Airport) {
    return (
        callsign && airport &&
        (!callsign.endsWith("_CTR") &&
            (callsign.startsWith(`${airport.icao}_`) || (airport.icao.startsWith("K") && callsign.startsWith(`${airport.icao.substring(1)}_`))))
    )
}

function clickAirport(airport: Airport) {
    router.push(`/airport/${airport.icao}`)
}
</script>
