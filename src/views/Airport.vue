<template>
    <v-container>
        <v-row>
            <v-col cols="4">
                <div class="text-h3">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="airport" class="mt-3">
                    <span v-if="airport.iata"
                        ><span class="pa-1">{{ airport.iata }}</span> |
                    </span>
                    <span class="pa-1">{{ airport.name }}</span> |
                    <router-link :to="`/fir/${airport.fir}`" class="pa-1">{{ airport.fir }}</router-link> |
                    <router-link :to="`/country/${airport.fir.substring(0, 2)}`" class="pa-1">{{
                        airport.fir.substring(0, 2)
                    }}</router-link>
                </div>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" md="6" v-for="atis in atises">
                <v-chip variant="flat" elevated label size="small" color="orange-darken-3" class="text-white font-weight-bold mb-1">
                    <span v-if="extractAtisCode(atis)">{{ extractAtisCode(atis) }}</span>
                    <span v-else class="text-black">{{ atis.atis_code || '/' }}</span>
                </v-chip>
                {{ atis.frequency }} {{ atis.callsign.replace(`${id}_`, "") }}
                <router-link :to="`/member/${atis.cid}`">{{ atis.name }}</router-link>
                <span class="text-grey ml-1">{{ moment.utc(moment().diff(moment(atis.logon_time))).format("HHmm") }}</span>
                <br />
                <div class="text-caption text-grey">
                    {{ atis.text_atis?.join("\n") }}
                </div>
            </v-col>
            <v-col cols="6" sm="3" lg="2" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ controller.callsign.replace(`${id}_`, "") }}
                </v-chip>
                {{ controller.frequency }}<br /><router-link :to="`/member/${controller.cid}`">{{ controller.name }}</router-link>
                <v-chip density="comfortable" class="ml-1" color="grey-lighten-1" style="padding: 5px">{{ rating(controller) }}</v-chip>
                <span class="text-grey ml-1">{{ moment.utc(moment().diff(moment(controller.logon_time))).format("HHmm") }}</span>
            </v-col>
        </v-row>
        <v-row class="mt-3">
            <v-col cols="12" sm="6">
                <v-row no-gutters class="bg-grey-darken-4 text-grey-lighten-1 pa-1">
                    <v-col sm="7"><v-icon class="mr-1">mdi-airplane-takeoff</v-icon>Departures</v-col>
                    <v-col sm="5" class="text-right">
                        <span v-if="departurePrefiles.length > 0" class="text-grey ml-3">{{ departurePrefiles.length }}</span>
                        <span v-if="nofpPilots.length > 0" class="text-grey-lighten-1 ml-3">{{ nofpPilots.length }}</span>
                        <span v-if="departingPilots.length > 0" class="text-cyan-lighten-2 ml-3">{{ departingPilots.length }}</span>
                        <span v-if="departedPilots.length > 0" class="text-cyan-darken-3 ml-3">{{ departedPilots.length }}</span>
                    </v-col>
                </v-row>
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="departurePrefiles.length > 0">PREFILED</div>
                <flight-row v-for="p in departurePrefiles" :key="p.callsign" :value="p" departure prefile />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="nofpPilots.length > 0">NO FLIGHTPLAN</div>
                <flight-row v-for="p in nofpPilots" :key="p.callsign" :value="p" departure nofp />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="departingPilots.length > 0">DEPARTING</div>
                <flight-row v-for="p in departingPilots" :key="p.callsign" :value="p" departure />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="departedPilots.length > 0">DEPARTED</div>
                <flight-row v-for="p in departedPilots" :key="p.callsign" :value="p" departure />
                <div
                    v-if="
                        departurePrefiles.length == 0 && nofpPilots.length == 0 && departingPilots.length == 0 && departedPilots.length == 0
                    "
                    class="mt-2 text-caption text-grey-darken-2 font-weight-light text-center"
                >
                    - NO DEPARTURES -
                </div>
            </v-col>
            <v-col cols="12" sm="6">
                <v-row no-gutters class="bg-grey-darken-4 text-grey-lighten-1 pa-1">
                    <v-col sm="7" class=""><v-icon class="mr-1">mdi-airplane-landing</v-icon>Arrivals</v-col>
                    <v-col sm="5" class="text-right">
                        <span v-if="arrivalPrefiles.length > 0" class="text-grey ml-3">{{ arrivalPrefiles.length }}</span>
                        <span v-if="arrivingPilots.length > 0" class="text-yellow-lighten-2 ml-3">{{ arrivingPilots.length }}</span>
                        <span v-if="arrivedPilots.length > 0" class="text-brown-lighten-1 ml-3">{{ arrivedPilots.length }}</span>
                    </v-col>
                </v-row>
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="arrivalPrefiles.length > 0">PREFILED</div>
                <flight-row v-for="p in arrivalPrefiles" :key="p.callsign" :value="p" arrival prefile />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="arrivingPilots.length > 0">ARRIVING</div>
                <flight-row v-for="p in arrivingPilots" :key="p.callsign" :value="p" arrival />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="arrivedPilots.length > 0">ARRIVED</div>
                <flight-row v-for="p in arrivedPilots" :key="p.callsign" :value="p" arrival />
                <div
                    v-if="arrivalPrefiles.length == 0 && arrivingPilots.length == 0 && arrivedPilots.length == 0"
                    class="mt-2 text-caption text-grey-darken-2 font-weight-light text-center"
                >
                    - NO ARRIVALS -
                </div>
            </v-col>
        </v-row>
        <div v-if="bookings.length > 0" class="mt-5 text-grey">
            <div class="bg-grey-darken-4 text-grey-lighten-1 pa-1 mb-2">Bookings</div>
            <Booking v-for="booking in bookings" :key="booking.id" :value="booking" :prefix="id" class="mt-1" />
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { Controller, useVatsimStore } from "@/store/vatsim"
import { useSettingsStore } from "@/store/settings"
import { computed, watch } from "vue"
import constants from "@/constants"
import { colorForController, compareControllers, labelForController, compareCallsigns, extractAtisCode } from "@/common"
import { eta, departureDistance, arrivalDistance, flightplanArrivalTime, flightplanDepartureTime, distanceToAirport } from "@/calc"
import FlightRow from "@/components/FlightRow.vue"
import Booking from "@/components/Booking.vue"
import moment from "moment"

const route = useRoute()
const vatsim = useVatsimStore()
const settings = useSettingsStore()

const id = computed(() => (route.params.id as string)?.toUpperCase())

const airport = computed(() => {
    return vatsim.airportByIcao[id.value]
})

const departedPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                (p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance) &&
                departureDistance(p) < settings.departedMaxRange
        )
        .sort((a, b) => departureDistance(a) - departureDistance(b))
})
const departingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                p.groundspeed < constants.inflightGroundspeed &&
                departureDistance(p) < constants.atAirportDistance
        )
        .sort((a, b) => a.flight_plan.deptime.localeCompare(b.flight_plan.deptime))
})
const nofpPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => !p.flight_plan && distanceToAirport(p, airport.value) < constants.atAirportDistance)
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})
const departurePrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure == id.value &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    (flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")) &&
                        flightplanDepartureTime(p.flight_plan)?.isBefore(moment().add(settings.prefileDepartureMaxMinutes, "minute"))))
        )
        .sort((a, b) => a.flight_plan.deptime.localeCompare(b.flight_plan.deptime))
})
const arrivingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => {
            if (!p.flight_plan || p.flight_plan.arrival != id.value) return false
            const departed = p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance
            const etaOrArrivalTime = eta(p) || flightplanArrivalTime(p.flight_plan, !departed)
            return (
                (p.groundspeed >= constants.inflightGroundspeed || arrivalDistance(p) >= constants.atAirportDistance) &&
                (!etaOrArrivalTime || etaOrArrivalTime.isBefore(moment().add(settings.arrivingMaxMinutes, "minute")))
            )
        })
        .sort((a, b) => {
            const etaA = eta(a) || flightplanArrivalTime(a.flight_plan)
            const etaB = eta(b) || flightplanArrivalTime(b.flight_plan)
            if (etaA && etaB) return etaA.diff(etaB)
            else if (etaA) return -1
            else if (etaB) return 1
            else return a.callsign.localeCompare(b.callsign)
        })
})
const arrivedPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots.filter(
        (p) =>
            p.flight_plan &&
            p.flight_plan.arrival == id.value &&
            p.groundspeed < constants.inflightGroundspeed &&
            arrivalDistance(p) < constants.atAirportDistance
    )
})
const arrivalPrefiles = computed(() => {
    if (!vatsim.data || !vatsim.data.prefiles) return []
    return vatsim.data.prefiles
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.arrival == id.value &&
                (!flightplanArrivalTime(p.flight_plan) ||
                    flightplanArrivalTime(p.flight_plan)?.isBefore(moment().add(settings.arrivingMaxMinutes, "minute"))) &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")))
        )
        .sort((a, b) => {
            const arrivalTimeA = flightplanArrivalTime(a.flight_plan)
            const arrivalTimeB = flightplanArrivalTime(b.flight_plan)
            if (arrivalTimeA && arrivalTimeB) return arrivalTimeA.diff(arrivalTimeB)
            return moment(a.last_updated).diff(b.last_updated)
        })
})

const fir = computed(() => vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => airport.value && f.icao == airport.value.fir))

const atises = computed(() => {
    if (!vatsim.data.atis) return []
    return vatsim.data.atis
        .filter((c) => c.callsign && c.callsign.startsWith(`${id.value}_`))
        .sort((a, b) => a.callsign.localeCompare(b.callsign))
})

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter((c) => isMatchingCallsign(c.callsign)).sort(compareControllers)
})

const bookings = computed(() => {
    if (!vatsim.bookings) return []
    return vatsim.bookings
        .filter(
            (b) =>
                //!controllers.value.find(c => c.callsign == b.callsign) &&
                moment(b.start) &&
                moment(b.end) &&
                moment(b.start).utc().isBefore(moment().add(settings.bookingsMaxHours, "hour")) &&
                moment(b.end).utc().isAfter(moment()) &&
                isMatchingCallsign(b.callsign)
        )
        .sort((a, b) => moment(a.start).diff(moment(b.start)) || compareCallsigns(a.callsign, b.callsign))
})

function isMatchingCallsign(callsign: string) {
    return (
        callsign &&
        ((!callsign.endsWith("_CTR") &&
            (callsign.startsWith(`${id.value}_`) || (id.value.startsWith("K") && callsign.startsWith(`${id.value.substring(1)}_`)))) ||
            (callsign.endsWith("_CTR") && airport.value && callsign.startsWith(`${airport.value.fir}_`)) ||
            (callsign.endsWith("_CTR") && fir.value && fir.value.callsignPrefix && callsign.startsWith(`${fir.value.callsignPrefix}_`)))
    )
}

function rating(controller: Controller) {
    if (!vatsim.data || !vatsim.data.ratings) return undefined
    const rating = vatsim.data.ratings.find(r => r.id == controller.rating)
    if (rating) return rating.short
}

let lastDepartures = undefined as string[] | undefined
watch([departurePrefiles, departingPilots, nofpPilots], () => {
    setTimeout(() => {
        let popup = false
        const allDepartures = [
            ...departurePrefiles.value.map((p) => p.callsign),
            ...departingPilots.value.map((p) => p.callsign),
            ...nofpPilots.value.map((p) => p.callsign),
        ]
        if (typeof lastDepartures != "undefined") {
            for (const callsign of allDepartures) {
                if (!lastDepartures.includes(callsign)) {
                    popup = true
                    console.log(`Popup departure ${callsign}`)
                }
            }
        }
        lastDepartures = allDepartures
        if (popup) {
            console.log("Gotta popup departure")
            // TODO notify
        }
    }, 1000)
})

let lastArrivals = undefined as string[] | undefined
watch([arrivalPrefiles, arrivingPilots], () => {
    setTimeout(() => {
        let popup = false
        const allArrivals = [...arrivalPrefiles.value.map((p) => p.callsign), ...arrivingPilots.value.map((p) => p.callsign)]
        if (typeof lastArrivals != "undefined") {
            for (const callsign of allArrivals) {
                if (!lastArrivals.includes(callsign)) {
                    popup = true
                    console.log(`Popup arrival ${callsign}`)
                }
            }
        }
        lastArrivals = allArrivals
        if (popup) {
            console.log("Gotta popup arrival")
            // TODO notify
        }
    }, 1000)
})
</script>
