<template>
    <div>
        <v-row v-for="airport in activeAirports" :key="airport.icao" no-gutters class="py-1" @click="clickAirport(airport)">
            <v-col sm="1">
                {{ airport.icao }}
            </v-col>
            <v-col sm="5">{{ airport.name }} </v-col>
            <v-col sm="1" class="text-right">
                <span v-if="vatsim.movements[airport.icao].prefiledDepartures" class="font-weight-light text-grey">{{
                    vatsim.movements[airport.icao].prefiledDepartures
                }}</span>
                <span
                    v-if="vatsim.movements[airport.icao].prefiledDepartures && vatsim.movements[airport.icao].departing"
                    class="font-weight-light text-grey ml-1"
                    >+</span
                >
                <span v-if="vatsim.movements[airport.icao].departing" class="ml-1">{{ vatsim.movements[airport.icao].departing }}</span>
            </v-col>
            <v-col sm="1" class="text-right">
                <span v-if="vatsim.movements[airport.icao].prefiledArrivals" class="font-weight-light text-grey">{{
                    vatsim.movements[airport.icao].prefiledArrivals
                }}</span>
                <span
                    v-if="vatsim.movements[airport.icao].prefiledArrivals && vatsim.movements[airport.icao].arriving"
                    class="font-weight-light text-grey ml-1"
                    >+</span
                >
                <span v-if="vatsim.movements[airport.icao].arriving" class="ml-1">{{ vatsim.movements[airport.icao].arriving }}</span>
            </v-col>
            <v-col sm="4" class="text-right">
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
        .filter((a) => !a.pseudo && a.icao in vatsim.movements && firs.value.includes(a.fir) && vatsim.movements[a.icao].pending > 0)
        .sort((a, b) => {
            const acount = vatsim.movements[a.icao].pending
            const bcount = vatsim.movements[b.icao].pending
            return acount >= bcount ? -1 : 1
        })
})

function clickAirport(airport: Airport) {
    router.push(`/airport/${airport.icao}`)
}
</script>
