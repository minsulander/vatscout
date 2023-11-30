<template>
    <div>
        <v-row v-for="airport in activeAirports" :key="airport.icao" no-gutters class="py-1" @click="clickAirport(airport)">
            <v-col cols="3" sm="1">
                {{ airport.icao }}
            </v-col>
            <v-col cols="9" sm="5">{{ airport.name }} </v-col>
            <v-col cols="2" sm="1" class="text-center">
                <span v-if="vatsim.getMovements(airport.icao).prefiledDepartures" class="text-grey mr-3">{{
                    vatsim.getMovements(airport.icao).prefiledDepartures
                }}</span>
                <span v-if="vatsim.getMovements(airport.icao).departing">{{ vatsim.getMovements(airport.icao).departing }}</span>
                <span v-if="vatsim.getMovements(airport.icao).departed" class="text-blue-darken-2 ml-3">{{  vatsim.getMovements(airport.icao).departed }}</span>
            </v-col>
            <v-col cols="2" sm="1" class="text-center">
                <span v-if="vatsim.getMovements(airport.icao).prefiledArrivals" class="text-grey mr-3">{{
                    vatsim.getMovements(airport.icao).prefiledArrivals
                }}</span>
                <span v-if="vatsim.getMovements(airport.icao).arriving">{{ vatsim.getMovements(airport.icao).arriving }}</span>
                <span v-if="vatsim.getMovements(airport.icao).arrived" class="text-brown-lighten-1 ml-3">{{  vatsim.getMovements(airport.icao).arrived }}</span>
            </v-col>
            <v-col cols="8" sm="4" class="text-right">
                <span v-for="atis in atises(airport)" :key="atis.callsign" class="mr-3">
                    <v-tooltip :text="`${atis.callsign} ${atis.frequency} ${atis.name}`" location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-chip
                                variant="flat"
                                elevated
                                label
                                size="small"
                                color="yellow-darken-4"
                                class="text-white font-weight-bold"
                                v-bind="props"
                                >{{ atis.atis_code }}
                            </v-chip>
                        </template>
                    </v-tooltip>
                </span>
                <span v-for="controller in controllers(airport)" :key="controller.callsign" class="mr-3">
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
    background: rgba(200, 200, 200, 0.2);
    cursor: pointer;
}
</style>

<script setup lang="ts">
import { Airport, Atis, Controller, useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import { colorForController, labelForController, compareControllers } from "@/common"
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
        .filter((a) => !a.pseudo && firs.value.includes(a.fir) && vatsim.getMovements(a.icao).pending > 0)
        .sort((a, b) => {
            const acount = vatsim.getMovements(a.icao).pending
            const bcount = vatsim.getMovements(b.icao).pending
            return acount >= bcount ? -1 : 1
        })
})

function clickAirport(airport: Airport) {
    router.push(`/airport/${airport.icao}`)
}
</script>
