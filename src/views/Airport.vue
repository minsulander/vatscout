<template>
    <v-container>
        <v-row>
            <v-col cols="4">
                <div class="text-h4">{{ id }}</div>
            </v-col>
            <v-col cols="8" class="text-right text-grey-lighten-1 text-h6 font-weight-light">
                <div v-if="airport" class="mt-3">
                    <span class="d-none d-sm-inline">
                        <span v-if="airport.iata"
                            ><span class="pa-1">{{ airport.iata }}</span> |
                        </span>
                        <span class="pa-1">{{ airport.name }}</span> |
                    </span>
                    <router-link :to="`/fir/${airport.fir}`" class="pa-1">{{ airport.fir }}</router-link> |
                    <router-link :to="`/country/${airport.fir.substring(0, 2)}`" class="pa-1">{{
                        airport.fir.substring(0, 2)
                    }}</router-link>
                </div>
            </v-col>
        </v-row>
        <div class="d-sm-none text-grey-lighten-1 text-h6 font-weight-light mb-3" v-if="airport">
            <span v-if="airport.iata"
                ><span class="pa-1">{{ airport.iata }}</span> |
            </span>
            <span class="pa-1">{{ airport.name }}</span>
        </div>
        <v-row>
            <v-col
                cols="12"
                lg="6"
                xl="2"
                v-for="atis in atises"
                style="cursor: pointer"
                :style="settings.expandAtis ? '' : 'max-height: 80px; overflow: hidden;'"
                @click="toggleAtis"
            >
                <v-chip variant="flat" elevated label size="small" color="orange-darken-3" class="text-white font-weight-bold mb-1">
                    <span v-if="extractAtisCode(atis)">{{ extractAtisCode(atis) }}</span>
                    <span v-else class="text-black">{{ atis.atis_code || "/" }}</span>
                </v-chip>
                {{ atis.frequency }} {{ atis.callsign.replace(`${id}_`, "").replace("_ATIS", "").replace("ATIS", "") }}
                <router-link :to="`/member/${atis.cid}`">{{ atis.name }}</router-link>
                <span class="text-grey ml-1">{{ moment.utc(moment().diff(moment(atis.logon_time))).format("HHmm") }}</span>
                <br />
                <div class="text-caption text-grey">
                    {{ atis.text_atis?.join("\n") }}
                </div>
            </v-col>
            <Controller v-for="controller in controllers" :value="controller" :prefix="id" />
        </v-row>
        <v-row class="mt-3">
            <v-col cols="12" sm="6">
                <v-row no-gutters class="bg-grey-darken-4 text-grey-lighten-1 pa-1">
                    <v-col sm="7"><v-icon class="mr-1">mdi-airplane-takeoff</v-icon>Departures</v-col>
                    <v-col sm="5" class="text-right">
                        <span v-if="departurePrefiles.length > 0" class="text-grey ml-3">{{ departurePrefiles.length }}</span>
                        <span v-if="nofpPilots.length > 0" class="text-grey-lighten-1 ml-3">{{ nofpPilots.length }}</span>
                        <span v-if="invalidfpPilots.length > 0" class="text-error ml-3">{{ invalidfpPilots.length }}</span>
                        <span v-if="departingPilots.length > 0" class="text-cyan-lighten-2 ml-3">{{ departingPilots.length }}</span>
                        <span v-if="departedPilots.length > 0" class="text-cyan-darken-3 ml-3">{{ departedPilots.length }}</span>
                    </v-col>
                </v-row>
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="departurePrefiles.length > 0">PREFILED</div>
                <flight-row
                    v-for="p in departurePrefiles"
                    :key="p.callsign"
                    :value="p"
                    departure
                    prefile
                    :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
                    @click="clickFlight(p.callsign)"
                />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="nofpPilots.length > 0">NO FLIGHTPLAN</div>
                <flight-row
                    v-for="p in nofpPilots"
                    :key="p.callsign"
                    :value="p"
                    departure
                    nofp
                    :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
                    @click="clickFlight(p.callsign)"
                />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="invalidfpPilots.length > 0">
                    INVALID FLIGHTPLAN
                </div>
                <flight-row
                    v-for="p in invalidfpPilots"
                    :key="p.callsign"
                    :value="p"
                    departure
                    invalid
                    :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
                    @click="clickFlight(p.callsign)"
                />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="departingPilots.length > 0">DEPARTING</div>
                <flight-row
                    v-for="p in departingPilots"
                    :key="p.callsign"
                    :value="p"
                    departure
                    :class="newDepartures.includes(p.callsign) ? 'bg-blue-grey-darken-4' : ''"
                    @click="clickFlight(p.callsign)"
                />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="departedPilots.length > 0">DEPARTED</div>
                <flight-row v-for="p in departedPilots" :key="p.callsign" :value="p" departure @click="clickFlight(p.callsign)" />
                <div
                    v-if="
                        departurePrefiles.length == 0 &&
                        nofpPilots.length == 0 &&
                        invalidfpPilots.length == 0 &&
                        departingPilots.length == 0 &&
                        departedPilots.length == 0
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
                <flight-row
                    v-for="p in arrivalPrefiles"
                    :key="p.callsign"
                    :value="p"
                    arrival
                    prefile
                    :class="newArrivals.includes(p.callsign) ? 'bg-brown-darken-3' : ''"
                    @click="clickFlight(p.callsign)"
                />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="arrivingPilots.length > 0">ARRIVING</div>
                <flight-row
                    v-for="p in arrivingPilots"
                    :key="p.callsign"
                    :value="p"
                    arrival
                    :class="newArrivals.includes(p.callsign) ? 'bg-brown-darken-3' : ''"
                    @click="clickFlight(p.callsign)"
                />
                <div class="text-caption text-grey-darken-2 font-weight-light mt-2 ml-1" v-if="arrivedPilots.length > 0">ARRIVED</div>
                <flight-row v-for="p in arrivedPilots" :key="p.callsign" :value="p" arrival @click="clickFlight(p.callsign)" />
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
        <v-snackbar v-model="snackbar" timeout="10000" color="grey-darken-4" class="mb-3">
            <span v-html="snackbarText" :class="'text-body-1 text-' + snackbarColor" />

            <template v-slot:actions>
                <v-btn icon size="small" @click="closeSnackbar"><v-icon>mdi-close</v-icon></v-btn>
            </template>
        </v-snackbar>
        <!--
        <v-btn @click="snackbar=true; snackbarColor='cyan'; snackbarText='New departure <b style=\'font-family: monospace\'>ABC123</b>'">Test snackbar</v-btn>
        -->
        <v-dialog v-model="showFlightDialog" width="90%">
            <v-card>
                <v-card-text>
                    <flight-details :id="flightCallsign" />
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { useSettingsStore } from "@/store/settings"
import { useDisplay } from "vuetify"
import { computed, ref, watch } from "vue"
import constants from "@/constants"
import { colorForController, compareControllers, labelForController, compareCallsigns, extractAtisCode } from "@/common"
import { eta, departureDistance, arrivalDistance, flightplanArrivalTime, flightplanDepartureTime, distanceToAirport } from "@/calc"
import FlightRow from "@/components/FlightRow.vue"
import Booking from "@/components/Booking.vue"
import Controller from "@/components/Controller.vue"
import FlightDetails from "@/components/FlightDetails.vue"
import moment from "moment"

const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()
const settings = useSettingsStore()
const display = useDisplay()

const id = computed(() => (route.params.id as string)?.toUpperCase())
const showFlightDialog = ref(false)
const flightCallsign = ref("")
const snackbar = ref(false)
const snackbarText = ref("")
const snackbarColor = ref("")

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
const invalidfpPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure != id.value &&
                p.flight_plan.arrival != id.value &&
                p.flight_plan.alternate != id.value &&
                distanceToAirport(p, airport.value) < constants.defAtAirportDistance &&
                p.groundspeed < constants.defInflightGroundspeed
        )
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
        .sort((a, b) => (flightplanArrivalTime(a.flight_plan)?.diff(flightplanArrivalTime(b.flight_plan)) || 0))
})
const arrivingPilots = computed(() => {
    if (!vatsim.data || !vatsim.data.pilots) return []
    return vatsim.data.pilots
        .filter((p) => {
            if (!p.flight_plan || p.flight_plan.arrival != id.value || p.flight_plan.departure == id.value) return false
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
            p.flight_plan.departure != id.value &&
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
                p.flight_plan.departure != id.value &&
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
        id.value &&
        ((!callsign.endsWith("_CTR") &&
            (callsign.startsWith(`${id.value}_`) || (id.value.startsWith("K") && callsign.startsWith(`${id.value.substring(1)}_`)))) ||
            (callsign.endsWith("_CTR") && airport.value && callsign.startsWith(`${airport.value.fir}_`)) ||
            (callsign.endsWith("_CTR") && fir.value && fir.value.callsignPrefix && callsign.startsWith(`${fir.value.callsignPrefix}_`)))
    )
}

function toggleAtis() {
    settings.expandAtis = !settings.expandAtis
    settings.save()
}

function closeSnackbar() {
    snackbar.value = false
    newDepartures.value = []
    newArrivals.value = []
}

function clickFlight(callsign: string) {
    if (display.xs.value) {
        router.push(`/flight/${callsign}`)
    } else {
        flightCallsign.value = callsign
        showFlightDialog.value = true
    }
}

import { Howl } from "howler"

const departurePopupSound = new Howl({ src: "/audio/pop.mp3" })
const arrivalPopupSound = new Howl({ src: "/audio/decide.mp3" })
const atcPopupSound = new Howl({ src: "/audio/notification.mp3" })

const arrivalCallsigns = () => [...arrivalPrefiles.value.map((p) => p.callsign), ...arrivingPilots.value.map((p) => p.callsign)]
let lastArrivals = vatsim.data.pilots ? arrivalCallsigns() : undefined
const newArrivals = ref([] as string[])
watch([arrivalPrefiles, arrivingPilots], () => {
    setTimeout(() => {
        let popups = []
        const allArrivals = arrivalCallsigns()
        if (typeof lastArrivals != "undefined") {
            for (const callsign of allArrivals) {
                if (!lastArrivals.includes(callsign)) popups.push(callsign)
            }
        }
        lastArrivals = allArrivals
        newArrivals.value = popups
        if (popups.length > 0) {
            if (settings.soundOn) {
                arrivalPopupSound.volume(settings.soundVolume / 100)
                arrivalPopupSound.play()
            }
            snackbarText.value =
                popups.length > 1
                    ? `New arrivals <b style=\'font-family: monospace\'>${popups.join(", ")}</b>.`
                    : `New arrival <b style=\'font-family: monospace\'>${popups[0]}</b>.`
            snackbarColor.value = "yellow"
            snackbar.value = true
            setTimeout(() => (newArrivals.value = []), 10000)
        }
    }, 500)
})

const departureCallsigns = () => [
    ...departurePrefiles.value.map((p) => p.callsign),
    ...departingPilots.value.map((p) => p.callsign),
    ...nofpPilots.value.map((p) => p.callsign),
]
let lastDepartures = vatsim.data.pilots ? departureCallsigns() : undefined
const newDepartures = ref([] as string[])
watch([departurePrefiles, departingPilots, nofpPilots], () => {
    setTimeout(() => {
        let popups = []
        const allDepartures = departureCallsigns()
        if (typeof lastDepartures != "undefined") {
            for (const callsign of allDepartures) {
                if (!lastDepartures.includes(callsign)) popups.push(callsign)
            }
        }
        lastDepartures = allDepartures
        newDepartures.value = popups
        if (popups.length > 0) {
            if (settings.soundOn) {
                departurePopupSound.volume(settings.soundVolume / 100)
                departurePopupSound.play()
            }
            snackbarText.value =
                popups.length > 1
                    ? `New departures <b style=\'font-family: monospace\'>${popups.join(", ")}</b>.`
                    : `New departure <b style=\'font-family: monospace\'>${popups[0]}</b>.`
            snackbarColor.value = "cyan"
            snackbar.value = true
            setTimeout(() => (newDepartures.value = []), 10000)
        }
    }, 1000)
})

const atcCallsigns = () => [...atises.value.map((a) => a.callsign), ...controllers.value.map((c) => c.callsign)]
let lastAtc = vatsim.data.controllers ? atcCallsigns() : undefined
watch([atises, controllers], () => {
    setTimeout(() => {
        let popups = []
        let popoffs = []
        const allAtc = atcCallsigns()
        if (typeof lastAtc != "undefined") {
            for (const callsign of allAtc) {
                if (!lastAtc.includes(callsign)) popups.push(callsign)
            }
            for (const callsign of lastAtc) {
                if (!allAtc.includes(callsign)) popoffs.push(callsign)
            }
        }
        lastAtc = allAtc
        if (popups.length > 0 || popoffs.length > 0) {
            if (settings.soundOn) {
                atcPopupSound.volume(settings.soundVolume / 100)
                atcPopupSound.play()
            }
            snackbarText.value = ""
            if (popups.length > 0) snackbarText.value += `<b style=\'font-family: monospace\'>${popups.join(", ")}</b> online. `
            if (popoffs.length > 0) snackbarText.value += `<b style=\'font-family: monospace\'>${popoffs.join(", ")}</b> offline. `
            snackbarColor.value = "white"
            snackbar.value = true
        }
    }, 1500)
})

watch(id, () => {
    if (!id.value || !airport.value) {
        lastDepartures = lastArrivals = lastAtc = []
    } else {
        lastDepartures = departureCallsigns()
        lastArrivals = arrivalCallsigns()
        lastAtc = atcCallsigns()
    }
})
</script>
