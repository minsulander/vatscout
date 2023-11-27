<template>
    <v-row v-for="airport in activeAirports" :key="airport.icao" no-gutters class="mt-2">
        <v-col sm="1">
            <router-link :to="`/airport/${airport.icao}`">{{ airport.icao }}</router-link>
        </v-col>
        <v-col sm="5">{{ airport.name }} </v-col>
        <v-col sm="1" class="text-right">
            <span v-if="departurePrefiles(airport.icao)" class="font-weight-light text-grey">{{ departurePrefiles(airport.icao) }}</span>
            <span v-if="departurePrefiles(airport.icao) && departingPilots(airport.icao)" class="font-weight-light text-grey ml-1">+</span>
            <span v-if="departingPilots(airport.icao)" class="ml-1">{{ departingPilots(airport.icao) }}</span>
        </v-col>
        <v-col sm="1" class="text-right">
            <span v-if="arrivalPrefiles(airport.icao)" class="font-weight-light text-grey">{{ arrivalPrefiles(airport.icao) }}</span>
            <span v-if="arrivalPrefiles(airport.icao) && arrivingPilots(airport.icao)" class="font-weight-light text-grey ml-1">+</span>
            <span v-if="arrivingPilots(airport.icao)" class="ml-1">{{ arrivingPilots(airport.icao) }}</span>
        </v-col>
        <v-col sm="4" class="text-right">
            <span v-for="atis in atises(airport)" :key="atis.callsign" class="mr-3">
                <v-tooltip :text="`${atis.callsign} ${atis.frequency} ${atis.name}`" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-chip elevated label size="small" color="yellow" v-bind="props">{{ atis.atis_code }} </v-chip>
                    </template>
                </v-tooltip>
            </span>
            <span v-for="controller in controllers(airport)" :key="controller.callsign" class="mr-3">
                <v-tooltip :text="`${controller.callsign} ${controller.frequency} ${controller.name}`" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-chip elevated label size="small" v-bind="props" :color="colorForController(controller)"
                            >{{ labelForController(controller) }}
                        </v-chip>
                    </template>
                </v-tooltip>
            </span>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { Airport, Atis, Controller, useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import constants from "@/constants"
const vatsim = useVatsimStore()
const props = defineProps<{ firs?: string[]; fir?: string }>()

const firs = props.firs ? props.firs : [props.fir]

function colorForController(controller: Controller) {
    if (controller.callsign.endsWith("DEL")) return "blue"
    if (controller.callsign.endsWith("GND")) return "green"
    if (controller.callsign.endsWith("TWR")) return "red"
    if (controller.callsign.endsWith("APP")) return "cyan"
    if (controller.callsign.endsWith("DEP")) return "cyan"
    if (controller.callsign.endsWith("CTR")) return "white"
    return "grey"
}

function labelForController(controller: Controller) {
    const underscore = controller.callsign.lastIndexOf("_")
    if (underscore >= 0) {
        return controller.callsign.substring(underscore + 1)
    }
    return controller.callsign
}

function departingPilots(icao: string) {
    if (!vatsim.data.pilots) return 0
    return vatsim.data.pilots.filter(
        (p) => p.flight_plan && p.flight_plan.departure == icao && p.groundspeed < constants.inflightGroundspeed
    ).length
}

function departurePrefiles(icao: string) {
    if (!vatsim.data.prefiles) return 0
    return vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.departure == icao).length
}

function arrivingPilots(icao: string) {
    if (!vatsim.data.pilots) return 0
    return vatsim.data.pilots.filter(
        (p) => p.flight_plan && p.flight_plan.arrival == icao && p.groundspeed >= constants.inflightGroundspeed
    ).length
}

function arrivalPrefiles(icao: string) {
    if (!vatsim.data.prefiles) return 0
    return vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.arrival == icao).length
}

function movements(icao: string) {
    if (!vatsim.data.pilots || !vatsim.data.prefiles) return 0
    return (
        vatsim.data.pilots.filter((p) => p.flight_plan && p.flight_plan.departure == icao && p.groundspeed < constants.inflightGroundspeed)
            .length +
        vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.departure == icao).length +
        vatsim.data.pilots.filter((p) => p.flight_plan && p.flight_plan.arrival == icao && p.groundspeed >= constants.inflightGroundspeed)
            .length +
        vatsim.data.prefiles.filter((p) => p.flight_plan && p.flight_plan.arrival == icao).length
    )
}

function atises(airport: Airport) {
    if (!vatsim.data.atis) return []
    return vatsim.data.atis.filter((c) => c.callsign && c.callsign.startsWith(`${airport.icao}_`))
}

function controllers(airport: Airport) {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter((c) => c.callsign && c.callsign.startsWith(`${airport.icao}_`))
}

const activeAirports = computed(() => {
    return vatsim.spy.airports
        .filter((a) => !a.pseudo && firs.includes(a.fir) && movements(a.icao) > 0)
        .sort((a, b) => {
            const acount = movements(a.icao)
            const bcount = movements(b.icao)
            return acount >= bcount ? -1 : 1
        })
})
</script>
