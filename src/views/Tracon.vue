<template>
    <div class="pa-2">
        <v-row>
            <v-col cols="4">
                <div class="text-h4">{{ id }}_APP</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="tracon" class="mt-3">
                    <span class="d-none d-sm-inline">
                        <span class="pa-1">{{ tracon.name }}</span> |
                    </span>
                    <span v-if="fir"
                        ><router-link :to="`/fir/${fir.icao}`" class="pa-1">{{ fir.icao }}</router-link> |</span
                    >
                    <router-link :to="`/country/${id.substring(0, 2)}`" class="pa-1">{{ id.substring(0, 2) }}</router-link>
                </div>
            </v-col>
        </v-row>
        <div class="d-sm-none text-grey-lighten-1 text-h6 font-weight-light mb-3" v-if="tracon">
            <span class="pa-1">{{ tracon.name }}</span>
        </div>
        <v-row>
            <Controller v-for="controller in controllers" :key="controller.cid" :value="controller" :prefix="id" />
        </v-row>
        <div v-for="airport in activeAirports" :key="airport.icao" class="mt-3">
            <v-row no-gutters @click="router.push(`/airport/${airport.icao}`)" style="cursor: pointer">
                <v-col cols="6" sm="1">
                    <div class="text-h6">{{ airport.icao }}</div>
                </v-col>
                <v-col sm="11" class="text-h6 font-weight-light text-grey-lighten-1">
                    <div class="float-right">
                        <Atis compact v-for="atis in atises(airport.icao)" :key="atis.callsign" :value="atis" class="ml-1" />
                        <Controller
                            compact
                            v-for="controller in localControllers(airport.icao)"
                            :key="controller.callsign"
                            :value="controller"
                            class="ml-1"
                        />
                    </div>
                    {{ airport.name }}
                </v-col>
            </v-row>
            <v-row no-gutters>
                <v-col cols="12" sm="6">
                    <departure-list compact :icao="airport.icao" @click="clickFlight" />
                </v-col>
                <v-col cols="12" sm="6">
                    <arrival-list compact :icao="airport.icao" @click="clickFlight" />
                </v-col>
            </v-row>
        </div>
        <div class="text-grey-darken-1 text-body-2 mt-5" v-if="inactiveAirportIds && inactiveAirportIds.length > 0">
                <span v-for="id in inactiveAirportIds"><router-link :to="`/airport/${id}`" class="text-grey-darken-1">{{ id }}</router-link>&nbsp; </span>
        </div>
        <v-dialog v-model="showFlightDialog" width="90%">
            <v-card color="#1e1f22">
                <v-card-text class="pa-3">
                    <flight-details :id="flightCallsign" />
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog v-model="showAtisDialog" width="600">
            <v-card v-if="atis">
                <v-card-text>
                    {{ atis.text_atis?.join("\n") }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import ArrivalList from "@/components/ArrivalList.vue"
import Atis from "@/components/Atis.vue"
import Controller from "@/components/Controller.vue"
import DepartureList from "@/components/DepartureList.vue"
import FlightDetails from "@/components/FlightDetails.vue"

import { compareControllers } from "@/common"
import { useVatsimStore } from "@/store/vatsim"
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDisplay } from "vuetify/lib/framework.mjs"

const vatsim = useVatsimStore()
const route = useRoute()
const router = useRouter()
const display = useDisplay()

const id = computed(() => (route.params.id as string)?.toUpperCase())
const boundary = computed(() => vatsim.traconBoundaries.find((b) => b.getProperties().id.toUpperCase() == id.value))
const tracon = computed(() => boundary.value?.getProperties())

const showFlightDialog = ref(false)
const flightCallsign = ref("")
const atis = ref(undefined as any)
const showAtisDialog = ref(false)

const airports = computed(
    () =>
        vatsim.spy &&
        vatsim.spy.airports &&
        vatsim.spy.airports.filter((a) => !a.pseudo && boundary.value?.getGeometry()?.intersectsCoordinate([a.longitude, a.latitude]))
)

const activeAirports = computed(
    () =>
        airports.value &&
        airports.value
            .filter((a) => {
                if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
                if (vatsim.movements[a.icao].total > 0) return true
                if (vatsim.data.controllers && vatsim.data.controllers.find((c) => isMatchingAirportCallsign(c.callsign, a.icao)))
                    return true
            })
            .sort((a, b) => {
                if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
                if (!(b.icao in vatsim.movements)) vatsim.movements[b.icao] = vatsim.countMovements(b.icao)
                const acount = vatsim.movements[a.icao].pending
                const bcount = vatsim.movements[b.icao].pending
                return acount >= bcount ? -1 : 1
            })
)

const inactiveAirportIds = computed(
    () => airports.value && airports.value.map((a) => a.icao).filter((icao) => !activeAirports.value.find((a) => a.icao == icao))
)

const fir = computed(
    () =>
        vatsim.spy &&
        vatsim.spy.firs &&
        vatsim.spy.firs.find((f) => airports.value && airports.value.length > 0 && f.icao == airports.value[0].fir)
)

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter((c) => c.facility > 0 && isMatchingCallsign(c.callsign)).sort(compareControllers)
})

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        ((!callsign.endsWith("_CTR") && callsign.startsWith(`${id.value}_`) && (callsign.endsWith("_APP") || callsign.endsWith("_DEP"))) ||
            (callsign.endsWith("_CTR") && fir.value && fir.value.callsignPrefix && callsign.startsWith(`${fir.value.callsignPrefix}_`)) ||
            (callsign.endsWith("_CTR") && fir.value && !fir.value.callsignPrefix && callsign.startsWith(`${fir.value.icao}_`)))
    )
}

const atises = (icao: string) =>
    vatsim.data &&
    vatsim.data.atis.filter((c) => c.callsign && c.callsign.startsWith(`${icao}_`)).sort((a, b) => a.callsign.localeCompare(b.callsign))

const localControllers = (icao: string) =>
    vatsim.data &&
    vatsim.data.controllers.filter((c) => isMatchingAirportCallsign(c.callsign, icao)).sort((a, b) => a.callsign.localeCompare(b.callsign))

function isMatchingAirportCallsign(callsign: string, icao: string) {
    return (
        callsign &&
        !callsign.endsWith("_CTR") &&
        !callsign.endsWith("_APP") &&
        !callsign.endsWith("_DEP") &&
        (callsign.startsWith(`${icao}_`) || (icao.startsWith("K") && callsign.startsWith(`${icao.substring(1)}_`)))
    )
}

function clickFlight(callsign: string) {
    if (display.xs.value) {
        router.push(`/flight/${callsign}`)
    } else {
        flightCallsign.value = callsign
        showFlightDialog.value = true
    }
}

function clickAtis(atisClicked: any) {
    atis.value = atisClicked
    showAtisDialog.value = true
}
</script>
