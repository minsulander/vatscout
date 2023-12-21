<template>
    <div>
        <v-row align="center">
            <v-col cols="6" md="3">
                <div class="text-h3">{{ id }}</div>
                <div class="text-grey-lighten-1" v-if="callsign">{{ callsign }} {{ id.substring(3) }}</div>
            </v-col>
            <v-col cols="6" md="3" class="text-center">
                <div v-if="flightplan" class="text-h5 font-weight-light pt-5" style="display: inline">{{ flightplan.aircraft_short }}</div>
                <v-chip
                    size="small"
                    variant="flat"
                    class="ml-2"
                    style="margin-top: -10px"
                    label
                    color="grey-darken-2"
                    v-if="typeClass && typeClass == 'H'"
                    ><v-icon>mdi-helicopter</v-icon></v-chip
                >
                <v-chip
                    size="small"
                    variant="flat"
                    class="ml-2"
                    style="margin-top: -10px"
                    label
                    color="grey-darken-2"
                    v-else-if="wtc && wtc != 'M'"
                    >{{ wtc }}</v-chip
                >
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
                    <v-row>
                        <v-col cols="6" class="text-truncate">
                            <router-link :to="`/airport/${flightplan.departure}`" class="pa-1">
                                {{ flightplan.departure }}
                                <span v-if="departureAirport" class="text-body-2 text-grey-lighten-1">{{ departureAirport.name }}</span>
                            </router-link>
                        </v-col>
                        <v-col cols="6" class="text-right text-truncate" style="direction: rtl" v-if="flightplan.arrival != flightplan.departure">
                            <router-link :to="`/airport/${flightplan.arrival}`" class="pa-1">
                                <span v-if="arrivalAirport" class="text-body-2 text-grey-lighten-1">{{ arrivalAirport.name }}</span>
                                {{ flightplan.arrival }}
                            </router-link>
                        </v-col>
                    </v-row>
                </span>
                <div v-if="pilot && flightplan">
                    <v-progress-linear
                        v-model="progress"
                        color="grey"
                        class="ma-1"
                        v-if="flightplan.arrival != flightplan.departure && typeof progress !== 'undefined'"
                    ></v-progress-linear>
                    <div class="float-right px-1" v-if="flightplan.arrival != flightplan.departure && isFinite(calc.arrivalDistance(pilot))">
                        <span class="text-caption text-grey">to go</span> {{ calc.arrivalDistance(pilot).toFixed(0) }}
                    </div>
                    <div class="float-left px-1" v-if="isFinite(calc.departureDistance(pilot))">
                        {{ calc.departureDistance(pilot).toFixed(0) }} <span class="text-caption text-grey">nm</span>
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
                        <v-chip v-if="pilot.pilot_rating" size="small" variant="flat" label class="ml-2" color="grey-darken-2">{{
                            pilotRating
                        }}</v-chip>
                        <v-chip v-if="pilot.military_rating" size="small" variant="flat" label class="ml-2" color="grey-darken-2">{{
                            militaryRating
                        }}</v-chip>
                    </router-link>
                    <!--{{ pilot.pilot_rating }} {{ pilot.military_rating }}-->
                </v-col>

                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">ETA</v-col>
                <v-col cols="10" sm="5">
                    <span v-if="calc.eta(pilot)"> {{ calc.eta(pilot)?.utc().format("HHmm") }}</span>
                    <span v-else-if="flightplan" class="text-grey">{{ calc.flightplanArrivalTime(flightplan, true)?.format("HHmm") }}</span>
                </v-col>

                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">
                    <span v-if="showQnhInHg && !showQnhHpa">Altimeter</span>
                    <span v-else>QNH</span>
                </v-col>
                <v-col cols="10" sm="5">
                    <span v-if="showQnhHpa" class="mr-3">{{ pilot.qnh_mb }} <span class="text-caption text-grey">hPa</span></span>
                    <span v-if="showQnhInHg">{{ pilot.qnh_i_hg.toFixed(2) }} <span class="text-caption text-grey">inHg</span></span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Radios</v-col>
                <v-col cols="10" sm="5">
                    <span
                        v-if="
                            flightplan && flightplan.assigned_transponder != '0000' && pilot.transponder != flightplan.assigned_transponder
                        "
                        class="text-warning"
                    >
                        {{ pilot.transponder }}
                    </span>
                    <span v-else>
                        {{ pilot.transponder }}
                    </span>
                    <span v-for="tx in transceivers" :key="tx.id" class="ml-3">
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
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Within</v-col>
                <v-col cols="10" class="text-body-2 text-grey-lighten-1">
                    <span v-for="boundary in within" class="mr-3">
                        <span v-if="vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == boundary.getProperties().id)">
                            <router-link :to="`/fir/${boundary.getProperties().id}`">{{ boundary.getProperties().id }}</router-link>
                        </span>
                        <span v-else-if="vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == boundary.getProperties().id)">
                            <router-link :to="`/airport/${boundary.getProperties().id}`">{{ boundary.getProperties().id }}</router-link>
                        </span>
                        <span v-else>
                            {{ boundary.getProperties().id }}
                        </span>
                    </span>
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
                    <span v-else-if="flightplan.flight_rules == 'V'" class="text-warning">VFR</span>
                    <span v-else>{{ flightplan.flight_rules }}</span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Altitude</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.altitude }}
                    <span class="text-caption text-grey">ft</span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Aircraft</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.aircraft_short }}
                    <span v-if="actypeName" class="text-body-2 text-grey"> - {{ actypeName }}</span>
                    <span v-if="actypeCode" class="text-body-2 text-grey">
                        -
                        <span style="white-space: nowrap">
                            <span v-if="wtc" :class="wtc != 'M' ? 'text-warning' : ''">{{ wtcText[wtc] }}</span>
                            <span v-if="typeClass" :class="typeClass != 'L' ? 'text-warning' : ''" class="ml-1">{{
                                typeClassText[typeClass]
                            }}</span>
                            <span v-if="noEngines" class="ml-1">{{ noEnginesText[noEngines] }}</span>
                            <span v-if="engineType" class="ml-1">{{ engineTypeText[engineType] }}</span>
                        </span>
                    </span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Cruise</v-col>
                <v-col cols="10" sm="5">
                    {{ flightplan.cruise_tas }}
                    <span class="text-caption text-grey">kts TAS</span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Departure</v-col>
                <v-col cols="10" sm="5">
                    <span v-if="!(flightplan.departure in vatsim.airportByIcao)">
                        <span class="bg-red-darken-3 pa-1">
                            {{ flightplan.departure }}
                        </span>
                        {{ flightplan.deptime }}
                    </span>
                    <router-link v-else :to="`/airport/${flightplan.departure}`">
                        {{ flightplan.departure }} {{ flightplan.deptime }}
                        <span v-if="departureAirport" class="text-body-2 text-grey"> - {{ departureAirport.name }}</span>
                    </router-link>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Arrival</v-col>
                <v-col cols="10" sm="5">
                    <router-link :to="`/airport/${flightplan.arrival}`">
                        {{ flightplan.arrival }}
                        <span class="text-grey">{{ calc.flightplanArrivalTime(flightplan)?.utc().format("HHmm") }}</span>
                        <span v-if="arrivalAirport" class="text-body-2 text-grey"> - {{ arrivalAirport.name }}</span>
                    </router-link>
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
                    <router-link :to="`/airport/${flightplan.alternate}`" v-if="flightplan.alternate">
                        {{ flightplan.alternate }}
                        <span v-if="alternateAirport" class="text-body-2 text-grey"> - {{ alternateAirport.name }}</span>
                    </router-link>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey">Squawk</v-col>
                <v-col cols="10" sm="5">
                    <span v-if="flightplan.assigned_transponder == '0000'" class="text-grey">
                        {{ flightplan.assigned_transponder }}
                    </span>
                    <span class="bg-red-darken-3 pa-1" v-else-if="pilot && pilot.transponder != flightplan.assigned_transponder">
                        {{ flightplan.assigned_transponder }}
                    </span>
                    <span v-else>
                        {{ flightplan.assigned_transponder }}
                    </span>
                </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey pt-3">Route</v-col>
                <v-col cols="10" sm="11" lg="5" class="text-grey-lighten-2 text-body-2" v-html="formattedRoute"> </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey pt-3">Remarks</v-col>
                <v-col cols="10" sm="11" lg="5" class="text-grey-lighten-2 text-body-2" v-html="formattedRemarks"> </v-col>
                <v-col cols="2" sm="1" class="text-right pr-2 text-caption text-grey pt-3">Revision</v-col>
                <v-col cols="10" sm="5" class="text-grey text-body-2">
                    {{ flightplan.revision_id }}
                </v-col>
            </v-row>
        </div>

        <div v-if="!pilot && !prefile" class="text-h5 font-weight-light text-grey mt-5">
            No connected pilot or prefiled flightplan with matching callsign.
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import { Pilot, useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import * as calc from "@/calc"

import moment from "moment"
import callsigns from "@/data/callsigns.json"
import actypecodes from "@/data/actypecodes.json"
import actypenames from "@/data/actypenames.json"
import constants from "@/constants"

const props = defineProps<{ id: string }>()
const vatsim = useVatsimStore()

const id = computed(() => props.id)

const callsign = computed(() => {
    if (flightplan.value && (flightplan.value.remarks.includes("CALLSIGN") || flightplan.value.remarks.includes("CS/"))) {
        const m = flightplan.value.remarks.match(/(CALLSIGN[\/=_ ]|CALLSIGN IS |CS\/)([\w\s-_"]+?)(TCAS|SIMBRIEF|\s\w+\/|\/|\(|$)/)
        if (m) return m.at(2)?.replaceAll('"', '')
    }
    return id.value.length > 3 && isFinite(parseInt(id.value.substring(3, 4))) && (callsigns as any)[id.value.substring(0, 3)]
})
const actypeName = computed(() => flightplan.value && (actypenames as any)[flightplan.value.aircraft_short])
const actypeCode = computed(() => flightplan.value && (actypecodes as any)[flightplan.value.aircraft_short])
const wtc = computed(() => actypeCode.value && actypeCode.value[0])
const wtcText: any = { L: "Light", M: "Medium", H: "Heavy", J: "Super" }
const typeClass = computed(() => actypeCode.value && actypeCode.value[1])
const typeClassText: any = { L: "Land", S: "Sea", A: "Amphibian", H: "Helicopter", G: "Gyrocopter", T: "Tiltrotor" }
const noEngines = computed(() => actypeCode.value && actypeCode.value[2])
const noEnginesText: any = { "1": "Single", "2": "Twin", "3": "3-Engine", "4": "4-Engine", "5": "5", "6": "6", "7": "7", "8": "8" }
const engineType = computed(() => actypeCode.value && actypeCode.value[3])
const engineTypeText: any = { J: "Jet", T: "Turbine", P: "Piston", E: "Electric" }
const pilotRating = computed(() => {
    if (!pilot.value) return undefined
    if (!pilot.value.pilot_rating) return undefined
    const rating = vatsim.data.pilot_ratings.find((r) => r.id == (pilot.value && pilot.value.pilot_rating))
    if (!rating) return undefined
    return rating.short_name
})
const militaryRating = computed(() => {
    if (!pilot.value) return undefined
    if (!pilot.value.military_rating) return undefined
    const rating = vatsim.data.military_ratings.find((r) => r.id == (pilot.value && pilot.value.military_rating))
    if (!rating) return undefined
    return rating.short_name
})

// TODO this is over-simplified
const inHgPrefixes = ["K", "C", "M"]
const showQnhHpa = computed(
    () =>
        !flightplan.value ||
        (flightplan.value.departure && !inHgPrefixes.includes(flightplan.value.departure[0])) ||
        (flightplan.value.arrival && !inHgPrefixes.includes(flightplan.value.arrival[0]))
)
const showQnhInHg = computed(
    () =>
        flightplan.value &&
        ((flightplan.value.departure && inHgPrefixes.includes(flightplan.value.departure[0])) ||
            (flightplan.value.arrival && inHgPrefixes.includes(flightplan.value.arrival[0])))
)

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
const alternateAirport = computed(() => {
    return flightplan.value && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.icao == flightplan.value!.alternate)
})
const progress = computed(() => {
    if (!pilot.value) return undefined
    const depdist = calc.departureDistance(pilot.value)
    const arrdist = calc.arrivalDistance(pilot.value)
    if (!isFinite(arrdist) || !isFinite(depdist)) return undefined
    if (depdist + arrdist < 0.1) return undefined
    return (depdist * 100) / (depdist + arrdist)
})

const formattedRoute = computed(() => {
    if (!flightplan.value || !flightplan.value.route) return ""
    let route = flightplan.value.route
    route = route.replaceAll(" DCT ", ' <span class="text-grey">DCT</span> ')
    return route
})

const formattedRemarks = computed(() => {
    if (!flightplan.value || !flightplan.value.remarks) return ""
    let rmk = flightplan.value.remarks.toUpperCase()
    rmk = rmk.replace(/(PBN\/\w+)T1/, '$1<span class="text-warning font-weight-bold">T1</span>')
    for (const phrase of constants.newPilotPhrases) {
        if (rmk.includes(phrase)) {
            rmk = rmk.replace(phrase, `<span class="text-warning font-weight-bold">${phrase}</span>`)
            break
        }
    }
    if (rmk.includes("CALLSIGN/")) {
        rmk = rmk.replace("CALLSIGN/", '<span class="text-grey">CALLSIGN/</span>')
    } else if (rmk.includes("CALLSIGN")) {
        rmk = rmk.replace("CALLSIGN", '<span class="text-warning font-weight-bold">CALLSIGN</span>')
    }
    rmk = rmk.replace("/T/", `<span class="text-warning font-weight-bold">/T/</span>`)
    rmk = rmk.replace("/R/", `<span class="text-warning font-weight-bold">/R/</span>`)
    for (const dim of [
        "PBN/",
        "NAV/",
        "DAT/",
        "DOF/",
        "REG/",
        "SEL/",
        "CODE/",
        "OPR/",
        "RVR/",
        "RMK/",
        "EET/",
        "PER/",
        "SUR/",
        "DEP/",
        "DEST/",
        "ALTN/",
        "RALT/",
        "TALT/",
        "ORGN/",
        "TYP/",
        "DLE/",
        "RIF/",
        "RFP/",
        "SIMBRIEF",
        "/V/",
        "//",
    ]) {
        rmk = rmk.replaceAll(dim, `<span class="text-grey">${dim}</span>`)
    }
    rmk = rmk.replace(/(TWITCH\.TV\/\w+)/, '<a class="text-purple-lighten-2 font-weight-bold" href="https://$1" target="_blank">$1</a>')
    rmk = rmk.replace(
        /(STREAM(ING)? ON TWITCH.(\w+))/,
        '<a class="text-purple-lighten-2 font-weight-bold" href="https://twitch.tv/$3" target="_blank">$1</a>'
    )
    return rmk
})
</script>
