<template>
    <div>
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
                <span v-if="vatsim.movements[airport.icao].pendingDepartures" class="text-cyan-lighten-2">{{
                    vatsim.movements[airport.icao].pendingDepartures
                }}</span>
            </v-col>
            <v-col cols="3" sm="1" class="text-center">
                <span v-if="vatsim.movements[airport.icao].pendingArrivals" class="text-yellow-lighten-2">{{
                    vatsim.movements[airport.icao].pendingArrivals
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
                <span v-for="atis in atises(airport)" :key="atis.callsign" class="ml-1">
                    <v-tooltip :text="`${atis.callsign} ${atis.frequency} ${atis.name}`" location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-chip
                                variant="flat"
                                elevated
                                label
                                size="small"
                                color="orange-darken-3"
                                class="text-white font-weight-bold"
                                v-bind="props"
                            >
                                <span v-if="extractAtisCode(atis)">{{ extractAtisCode(atis) }}</span>
                                <span v-else class="text-black">{{ atis.atis_code || "/" }}</span>
                            </v-chip>
                        </template>
                    </v-tooltip>
                </span>
                <span v-for="controller in controllers(airport)" :key="controller.callsign" class="ml-1">
                    <v-tooltip :text="`${controller.callsign} ${controller.frequency} ${controller.name}`" location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-chip
                                variant="flat"
                                elevated
                                label
                                size="small"
                                class="font-weight-bold"
                                v-bind="props"
                                :color="colorForController(controller)"
                                >{{ labelForController(controller) }}
                            </v-chip>
                        </template>
                    </v-tooltip>
                </span>
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
import { Airport, Atis, Controller, useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import { colorForController, labelForController, compareControllers, extractAtisCode } from "@/common"
import { useRouter } from "vue-router"
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
            if (vatsim.movements[a.icao].pending > 0) return true
            if (vatsim.data.controllers && vatsim.data.controllers.find(c => isMatchingCallsign(c.callsign, a))) return true
        })
        .sort((a, b) => {
            if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
            if (!(b.icao in vatsim.movements)) vatsim.movements[b.icao] = vatsim.countMovements(b.icao)
            const acount = vatsim.movements[a.icao].pending
            const bcount = vatsim.movements[b.icao].pending
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
