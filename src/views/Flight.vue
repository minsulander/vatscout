<template>
    <v-container>
        <v-row align="center">
            <v-col cols="6" md="3">
                <div class="text-h3">{{ id }}</div>
            </v-col>
            <v-col cols="6" md="3" class="text-center">
                <div v-if="flightplan" class="text-h5 font-weight-light pt-5" style="display: inline">{{ flightplan.aircraft_short }}</div>
                <v-chip v-if="prefile" variant="flat" size="small" label color="grey-darken-2" class="ml-2" style="margin-top: -10px"
                    >PREFILE</v-chip
                >
                <v-chip
                    v-if="pilot && !flightplan"
                    variant="flat"
                    size="small"
                    label
                    color="grey-darken-2"
                    class="ml-2"
                    style="margin-top: -10px"
                    >NO FLIGHTPLAN</v-chip
                >
            </v-col>
            <v-col cols="12" md="6" style="white-space: nowrap">
                <span v-if="flightplan">
                    <div class="float-right mb-1">
                        <router-link :to="`/airport/${flightplan.arrival}`" class="pa-1">
                            <span v-if="arrivalAirport" class="text-body-2 text-grey-lighten-1">{{ arrivalAirport.name }}</span>
                            {{ flightplan.arrival }}
                        </router-link>
                    </div>
                    <div class="float-left">
                        <router-link :to="`/airport/${flightplan.departure}`" class="pa-1">
                            {{ flightplan.departure }}
                            <span v-if="departureAirport" class="text-body-2 text-grey-lighten-1">{{ departureAirport.name }}</span>
                        </router-link>
                    </div>
                </span>
                <div v-if="pilot">
                    <v-progress-linear
                        v-model="progress"
                        color="grey"
                        class="ma-1"
                        v-if="typeof progress !== 'undefined'"
                    ></v-progress-linear>
                    <div class="float-right px-1" v-if="isFinite(arrivalDistance(pilot))">
                        {{ arrivalDistance(pilot).toFixed(0) }} <span class="text-caption text-grey">nm to go</span>
                    </div>
                    <div class="float-left px-1" v-if="isFinite(departureDistance(pilot))">
                        {{ departureDistance(pilot).toFixed(0) }} <span class="text-caption text-grey">nm covered</span>
                    </div>
                    <div class="text-center text-body-2 text-grey pt-1">
                        <span class="mr-3">{{ pilot.heading }}°</span>
                        <span class="mr-3">{{ pilot.altitude }} ft</span>
                        {{ pilot.groundspeed }} kts
                    </div>
                </div>
            </v-col>
        </v-row>

        <div v-if="pilot" class="mt-5">
            <v-row align="baseline" no-gutters>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Pilot</v-col>
                <v-col cols="10" sm="5">
                    <router-link :to="`/member/${pilot.cid}`">
                        {{ pilot.name }}
                        <span class="text-grey-lighten-1">{{ pilot.cid }}</span>
                    </router-link>
                    <!--{{ pilot.pilot_rating }} {{ pilot.military_rating }}-->
                </v-col>

                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Within</v-col>
                <v-col cols="10" sm="5">
                    <span v-for="boundary in within" class="mr-3">
                        <span v-if="vatsim.spy.firs.find((f) => f.icao == boundary.getProperties().id)">
                            <router-link :to="`/fir/${boundary.getProperties().id}`">{{ boundary.getProperties().id }}</router-link>
                        </span>
                        <span v-else-if="vatsim.spy.airports.find((a) => a.icao == boundary.getProperties().id)">
                            <router-link :to="`/airport/${boundary.getProperties().id}`">{{ boundary.getProperties().id }}</router-link>
                        </span>
                        <span v-else>
                            {{ boundary.getProperties().id }}
                        </span>
                    </span>
                </v-col>

                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Settings</v-col>
                <v-col cols="10" sm="5">
                    {{ pilot.qnh_i_hg.toFixed(2) }} <span class="text-caption text-grey">inHg</span> {{ pilot.qnh_mb }}
                    <span class="text-caption text-grey">hPa</span> {{ pilot.transponder }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Radios</v-col>
                <v-col cols="10" sm="5">
                    <span v-for="tx in transceivers" :key="tx.id" class="mr-3">
                        {{ (tx.frequency / 1e6).toFixed(3) }}
                    </span>
                </v-col>

                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Online</v-col>
                <v-col cols="10" sm="5">
                    {{ moment.utc(moment().diff(moment(pilot.logon_time))).format("HHmm") }}
                    <span class="text-body-2 text-grey">{{ pilot.server }}</span>
                </v-col>

                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Updated</v-col>
                <v-col cols="10" sm="5">
                    {{ moment(pilot.last_updated).utc().format("HH:mm:ss") }}
                </v-col>
            </v-row>
        </div>
        <div v-else-if="prefile" class="mt-5">
            <v-row no-gutters align="baseline">
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Prefiled</v-col>
                <v-col cols="10" sm="5">
                    {{ prefile.name }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Updated</v-col>
                <v-col cols="10" sm="5">
                    {{ moment(prefile.last_updated).utc().format("HH:mm:ss") }}
                </v-col>
            </v-row>
        </div>
        <div v-if="flightplan" class="mt-5">
            <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mb-2">Flightplan</div>

            <v-row no-gutters align="baseline">
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Rules</v-col>
                <v-col cols="10" sm="5">
                    <span v-if="flightplan.flight_rules == 'I'" class="text-grey">IFR</span>
                    <span v-else-if="flightplan.flight_rules == 'V'" class="text-yellow">VFR</span>
                    <span v-else>{{ flightplan.flight_rules }}</span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Altitude</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.altitude }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Aircraft</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.aircraft_short }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Cruise</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.cruise_tas }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Departure</v-col>
                <v-col cols="10" sm="5"> {{ flightplan.departure }} {{ flightplan.deptime }} </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Arrival</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.arrival }} <span class="text-grey">{{ flightplanArrivalTime(flightplan)?.format("HHmm") }}</span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Enroute</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.enroute_time }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Fuel</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.fuel_time }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Alternate</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.alternate }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Squawk</v-col>
                <v-col cols="10" sm="5">
                    <span v-if="flightplan.assigned_transponder == '0000'" class="text-grey">
                        {{ flightplan.assigned_transponder }}
                    </span>
                    <span class="bg-red pa-1" v-else-if="pilot && pilot.transponder != flightplan.assigned_transponder">
                        {{ flightplan.assigned_transponder }}
                    </span>
                    <span v-else>
                        {{ flightplan.assigned_transponder }}
                    </span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey pt-3">Route</v-col>
                <v-col cols="10" sm="11" class="text-grey-lighten-2 text-body-2">
                    {{ flightplan.route }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey pt-3">Remarks</v-col>
                <v-col cols="10" sm="11" class="text-grey-lighten-2 text-body-2">
                    {{ flightplan.remarks }}
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey pt-3">Revision</v-col>
                <v-col cols="10" sm="5" class="text-grey text-body-2">
                    {{ flightplan.revision_id }}
                </v-col>
            </v-row>
        </div>

        <div v-if="!pilot && !prefile" class="text-h5 font-weight-light text-grey mt-5">
            No connected pilot or prefiled flightplan with matching callsign.
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import { arrivalDistance, departureDistance, flightplanArrivalTime } from "@/calc"
import moment from "moment"
const route = useRoute()
const vatsim = useVatsimStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const pilot = computed(() => {
    return vatsim.data.pilots && vatsim.data.pilots.find((p) => p.callsign == id.value)
})
const prefile = computed(() => {
    return vatsim.data.prefiles && vatsim.data.prefiles.find((p) => p.callsign == id.value)
})
const flightplan = computed(() => {
    if (pilot.value) return pilot.value.flight_plan
    if (prefile.value) return prefile.value.flight_plan
})
const transceivers = computed(() => {
    return vatsim.transceivers[id.value]
})
const within = computed(() => {
    if (!pilot.value || !pilot.value.longitude || !pilot.value.latitude) return []
    const boundaries = []
    for (const boundary of vatsim.boundaries) {
        if (boundary.getGeometry()!.intersectsCoordinate([pilot.value.longitude, pilot.value.latitude])) {
            boundaries.push(boundary)
        }
    }
    for (const boundary of vatsim.traconBoundaries) {
        if (boundary.getGeometry()!.intersectsCoordinate([pilot.value.longitude, pilot.value.latitude])) {
            boundaries.push(boundary)
        }
    }
    return boundaries
})
const departureAirport = computed(() => {
    return flightplan.value && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == flightplan.value!.departure)
})
const arrivalAirport = computed(() => {
    return flightplan.value && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == flightplan.value!.arrival)
})
const progress = computed(() => {
    if (!pilot.value) return undefined
    const depdist = departureDistance(pilot.value)
    const arrdist = arrivalDistance(pilot.value)
    if (!isFinite(arrdist) || !isFinite(depdist)) return undefined
    if (depdist + arrdist < 0.1) return undefined
    return (depdist * 100) / (depdist + arrdist)
})
</script>
