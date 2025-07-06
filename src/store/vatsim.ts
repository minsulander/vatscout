import { arrivalDistance, closestAirport, departureDistance, distanceToAirport, eta, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import constants from "@/constants"
import axios from "axios"
import moment from "moment"
import FeatureLike from "ol/Feature"
import GeoJSON from "ol/format/GeoJSON"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useSettingsStore } from "./settings"
import { compareCallsigns } from "@/common"

export const apiBaseUrl = "https://api.vatscout.com"

export interface Controller {
    callsign: string
    cid: number
    facility: number
    frequency: string
    last_updated: string
    logon_time: string
    name: string
    rating: number
    server: string
    text_atis?: string[]
    visual_range: number
}

export interface Atis extends Controller {
    atis_code: string
}

export interface Facility {
    id: number
    long: string
    short: string
}

export interface PilotRating {
    id: number
    short_name: string
    long_name: string
}

export interface Rating {
    id: number
    short: string
    long: string
}

export interface GeneralData {
    version: number
    reload: number
    unique_users: number
    update: string
    update_timestamp: string
    connected_clients: number
}

export interface FlightPlan {
    aircraft: string
    aircraft_faa: string
    aircraft_short: string
    alternate: string
    altitude: string
    arrival: string
    assigned_transponder: string
    cruise_tas: string
    departure: string
    deptime: string
    enroute_time: string
    flight_rules: string
    fuel_time: string
    remarks: string
    revision_id: number
    route: string
}

export interface Pilot {
    altitude: number
    callsign: string
    cid: number
    flight_plan: FlightPlan
    groundspeed: number
    heading: number
    last_updated: string
    latitude: number
    logon_time: string
    longitude: number
    military_rating: number
    name: string
    pilot_rating: number
    qnh_i_hg: number
    qnh_mb: number
    server: string
    transponder: string
}

export interface Prefile {
    callsign: string
    cid: number
    flight_plan: FlightPlan
    last_updated: string
    name: string
}

export interface VatsimData {
    atis: Atis[]
    controllers: Controller[]
    facilities: Facility[]
    general: GeneralData
    military_ratings: PilotRating[]
    pilot_ratings: PilotRating[]
    pilots: Pilot[]
    prefiles: Prefile[]
    ratings: Rating[]
    // servers
}

export interface Transceiver {
    id: number
    frequency: number
    latDeg: number
    lonDeg: number
    heightMslM: number
    heightAglM: number
}

export interface Country {
    name: string
    prefix: string
    facility: string
}

export interface Airport {
    icao: string
    iata: string
    name: string
    latitude: number
    longitude: number
    fir: string
    pseudo: boolean
}

export interface FIR {
    icao: string
    name: string
    callsignPrefix: string
    firBoundary: string
}

export interface UIR {
    id: string
    name: string
    firBoundaries: string[]
}

export interface VatspyData {
    countries: Country[]
    airports: Airport[]
    firs: FIR[]
    uirs: UIR[]
}

export interface Booking {
    callsign: string
    cid: number
    division: string
    end: string
    id: number
    start: string
    subdivision: string
    type: string
}

export class AirportMovements {
    departed: number = 0
    nofp: number = 0
    invalidfp: number = 0
    departing: number = 0
    prefiledDepartures: number = 0
    arrived: number = 0
    arriving: number = 0
    prefiledArrivals: number = 0

    get departures() {
        return this.departed + this.departing + this.nofp + this.prefiledDepartures
    }

    get arrivals() {
        return this.arrived + this.arriving + this.prefiledArrivals
    }

    get total() {
        return this.departures + this.arrivals
    }

    get activeDepartures() {
        return this.departing + this.nofp + this.invalidfp
    }

    get activeArrivals() {
        return this.arriving
    }

    get active() {
        return this.activeDepartures + this.activeArrivals
    }

    get inactiveDepartures() {
        return this.departed + this.prefiledDepartures
    }

    get inactiveArrivals() {
        return this.arrived
    }

    get inactive() {
        return this.inactiveDepartures + this.inactiveArrivals
    }
}

export const useVatsimStore = defineStore("vatsim", () => {
    const settings = useSettingsStore()

    const data = ref({} as VatsimData)
    const transceivers = ref({} as { [key: string]: Transceiver[] })
    const spy = ref({} as VatspyData)
    const airportByIcao = ref({} as { [key: string]: Airport })
    const boundaries = ref([] as FeatureLike[])
    const traconBoundaries = ref([] as FeatureLike[])
    const bookings = ref([] as Booking[])
    const timeUntilRefresh = ref(0)
    const refreshing = ref(0)

    const movements = ref({} as { [key: string]: AirportMovements })

    function countMovements(airport_icao: string) {
        const moves = new AirportMovements()
        if (!data.value.pilots || !data.value.prefiles) return moves
        for (const p of data.value.pilots.filter(
            (p) => p.flight_plan && (p.flight_plan.departure == airport_icao || p.flight_plan.arrival == airport_icao)
        )) {
            if (p.flight_plan.departure == airport_icao) {
                if (
                    (p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance) &&
                    departureDistance(p) < settings.departedMaxRange
                )
                    moves.departed++
                else if (p.groundspeed < constants.inflightGroundspeed && departureDistance(p) < constants.atAirportDistance)
                    moves.departing++
            } else if (p.flight_plan.arrival == airport_icao) {
                const departed = p.groundspeed >= constants.inflightGroundspeed || departureDistance(p) >= constants.atAirportDistance
                const etaOrArrivalTime = eta(p) || flightplanArrivalTime(p.flight_plan, !departed)
                if (
                    (p.groundspeed >= constants.inflightGroundspeed || arrivalDistance(p) >= constants.atAirportDistance) &&
                    (!etaOrArrivalTime || etaOrArrivalTime.isBefore(moment().add(settings.arrivingMaxMinutes, "minute")))
                )
                    moves.arriving++
                else if (p.groundspeed < constants.inflightGroundspeed && arrivalDistance(p) < constants.atAirportDistance) moves.arrived++
            }
        }
        for (const p of data.value.pilots.filter((p) => !p.flight_plan)) {
            if (
                distanceToAirport(p, airportByIcao.value[airport_icao]) < constants.atAirportDistance &&
                p.groundspeed < constants.motionGroundspeed &&
                closestAirport(p)?.icao == airport_icao
            )
                moves.nofp++
        }
        for (const p of data.value.pilots.filter(
            (p) =>
                p.flight_plan &&
                p.flight_plan.departure != airport_icao &&
                p.flight_plan.arrival != airport_icao &&
                p.flight_plan.alternate != airport_icao
        )) {
            if (
                p.groundspeed < constants.motionGroundspeed &&
                distanceToAirport(p, airportByIcao.value[airport_icao]) < constants.atAirportDistance &&
                distanceToAirport(p, airportByIcao.value[p.flight_plan.departure]) >= constants.atAirportDistance &&
                distanceToAirport(p, airportByIcao.value[p.flight_plan.arrival]) >= constants.atAirportDistance &&
                distanceToAirport(p, airportByIcao.value[p.flight_plan.alternate]) >= constants.atAirportDistance
            )
                moves.invalidfp++
        }
        for (const p of data.value.prefiles.filter(
            (p) => p.flight_plan && (p.flight_plan.departure == airport_icao || p.flight_plan.arrival == airport_icao)
        )) {
            if (
                p.flight_plan.departure == airport_icao &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    (flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")) &&
                        flightplanDepartureTime(p.flight_plan)?.isBefore(moment().add(settings.prefileDepartureMaxMinutes, "minute"))))
            ) {
                moves.prefiledDepartures++
            } else if (
                p.flight_plan.arrival == airport_icao &&
                (!flightplanArrivalTime(p.flight_plan) ||
                    flightplanArrivalTime(p.flight_plan)?.isBefore(moment().add(settings.arrivingMaxMinutes, "minute"))) &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")))
            ) {
                moves.prefiledArrivals++
            }
        }
        return moves
    }

    const refreshInterval = computed(() => (iAmOnline.value ? constants.refreshIntervalOnline : constants.refreshIntervalOffline))

    const iAmOnline = computed(() => isCidOnline(settings.cid))

    function isCidOnline(cid: number) {
        return !!(
            (data.value.controllers && data.value.controllers.find((c) => c.cid == cid && c.facility > 0)) ||
            (data.value.pilots && data.value.pilots.find((p) => p.cid == cid))
        )
    }

    function getAtises(icao: string) {
        return (
            (data.value &&
                data.value.atis &&
                data.value.atis
                    .filter((c) => c.callsign && c.callsign.startsWith(`${icao}_`))
                    .sort((a, b) => a.callsign.localeCompare(b.callsign))) ||
            []
        )
    }

    function getLocalControllers(icao: string, excludeAppDep = false) {
        return (data.value &&
            data.value.controllers &&
            data.value.controllers
                .filter(
                    (c) =>
                        c.facility > 0 &&
                        (settings.showUnprimedControllers || c.frequency != "199.998") &&
                        isMatchingAirportCallsign(c.callsign, icao)
                )
                .sort((a, b) => compareCallsigns(a.callsign, b.callsign))) ||
        []
            }

    function isMatchingAirportCallsign(callsign: string, icao: string, excludeAppDep = false) {
        return (
            callsign &&
            !callsign.endsWith("_CTR") &&
            (!excludeAppDep || (!callsign.endsWith("_APP") && !callsign.endsWith("_DEP"))) &&
            (callsign.startsWith(`${icao}_`) || (icao.startsWith("K") && callsign.startsWith(`${icao.substring(1)}_`)))
        )
    }

    async function fetchData() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`${apiBaseUrl}/data`)
            data.value = response.data as VatsimData
            if (spy.value.airports && spy.value.airports.length > 0) movements.value = {}
            console.log(`Got data in ${(new Date().getTime() - startRequest).toFixed()} ms`)
        } finally {
            refreshing.value--
        }
    }

    async function fetchTransceivers() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`${apiBaseUrl}/transceivers`)
            const xcs: { [key: string]: Transceiver[] } = {}
            for (const entry of response.data) {
                if (!(entry.callsign in xcs)) xcs[entry.callsign] = []
                for (const entryxc of entry.transceivers) {
                    xcs[entry.callsign].push(entryxc as Transceiver)
                }
            }
            transceivers.value = xcs
            console.log(`Got transceivers in ${(new Date().getTime() - startRequest).toFixed()} ms`)
        } finally {
            refreshing.value--
        }
    }

    async function fetchSpy() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`${apiBaseUrl}/spy`)
            let section = ""
            const spydata = { countries: [], airports: [], firs: [], uirs: [] } as VatspyData
            for (const line of response.data.replaceAll("\r", "").split("\n")) {
                if (line.startsWith(";")) {
                    // comment line
                } else if (line.startsWith("[")) {
                    section = line.substring(1, line.length - 1).toLowerCase()
                } else if (section == "countries") {
                    const cols = line.split("|")
                    const country = {
                        name: cols[0],
                        prefix: cols[1],
                        facility: cols[2],
                    }
                    spydata.countries.push(country)
                } else if (section == "airports") {
                    // ;ICAO|Airport Name|Latitude Decimal|Longitude Decimal|IATA/LID|FIR|IsPseudo
                    const cols = line.split("|")
                    const airport = {
                        icao: cols[0],
                        name: cols[1],
                        latitude: parseFloat(cols[2]),
                        longitude: parseFloat(cols[3]),
                        iata: cols[4],
                        fir: cols[5],
                        pseudo: cols[6] == "1",
                    } as Airport
                    spydata.airports.push(airport)
                    if (!airport.pseudo) airportByIcao.value[airport.icao] = airport
                } else if (section == "firs") {
                    // ;ICAO|NAME|CALLSIGN PREFIX|FIR BOUNDARY
                    const cols = line.split("|")
                    const fir = {
                        icao: cols[0],
                        name: cols[1],
                        callsignPrefix: cols[2],
                        firBoundary: cols[3],
                    }
                    spydata.firs.push(fir)
                } else if (section == "uirs") {
                    const cols = line.split("|")
                    const uir = {
                        id: cols[0],
                        name: cols[1],
                        firBoundaries: cols[2] ? cols[2].split(",") : [],
                    }
                    spydata.uirs.push(uir)
                } else if (section == "idl") {
                    //
                } else {
                    console.log("wut?", section, line)
                }
            }
            spy.value = spydata
            console.log(`Got spy in ${(new Date().getTime() - startRequest).toFixed()} ms`)
        } finally {
            refreshing.value--
        }
    }

    async function fetchBoundaries() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`${apiBaseUrl}/boundaries`)
            const features = new GeoJSON().readFeatures(response.data) as FeatureLike[]
            boundaries.value = features
            console.log(`Got boundaries in ${(new Date().getTime() - startRequest).toFixed()} ms`)
        } finally {
            refreshing.value--
        }
    }

    async function fetchTraconBoundaries() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`/data/TRACONBoundaries.geojson`)
            // flatten nested FeatureCollections as OpenLayers doesn't support it
            const flatFeatures = []
            for (const feature of response.data.features) {
                if (feature.type == "FeatureCollection") {
                    for (const f of feature.features) flatFeatures.push(f)
                } else {
                    flatFeatures.push(feature)
                }
            }
            response.data.features = flatFeatures
            const features = new GeoJSON().readFeatures(response.data) as FeatureLike[]
            traconBoundaries.value = features
            console.log(`Got tracon boundaries in ${(new Date().getTime() - startRequest).toFixed()} ms`)
        } finally {
            refreshing.value--
        }
    }

    async function fetchBookings() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`${apiBaseUrl}/bookings`)
            for (const d of response.data) {
                if (d.start) d.start += "Z"
                if (d.end) d.end += "Z"
            }
            bookings.value = response.data as Booking[]
            console.log(`Got bookings in ${(new Date().getTime() - startRequest).toFixed()} ms`)
        } finally {
            refreshing.value--
        }
    }

    let lastBookingsRefresh = 0
    let lastStaticDataRefresh = 0

    if (!(window as any).refreshInterval) {
        ;(window as any).refreshInterval = setInterval(() => {
            timeUntilRefresh.value -= 500
            if (timeUntilRefresh.value > refreshInterval.value) timeUntilRefresh.value = refreshInterval.value
            if (timeUntilRefresh.value <= 0) {
                timeUntilRefresh.value = refreshInterval.value
                if (document.visibilityState == "visible") {
                    fetchData()
                    fetchTransceivers()
                    if (bookings.value.length == 0 || new Date().getTime() - lastBookingsRefresh > constants.bookingsRefreshInterval) {
                        setTimeout(() => fetchBookings(), 800)
                        lastBookingsRefresh = new Date().getTime()
                    }
                    if (
                        !spy.value.countries ||
                        boundaries.value.length == 0 ||
                        traconBoundaries.value.length == 0 ||
                        new Date().getTime() - lastStaticDataRefresh > constants.staticDataRefreshInterval
                    ) {
                        if (!spy.value.countries) setTimeout(() => fetchSpy(), 200)
                        if (boundaries.value.length == 0) setTimeout(() => fetchBoundaries(), 400)
                        if (traconBoundaries.value.length == 0) setTimeout(() => fetchTraconBoundaries(), 600)
                        lastStaticDataRefresh = new Date().getTime()
                    }
                } else {
                    console.log("Not refreshing - not visible")
                }
            }
        }, 500)
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState == "visible") {
                if (
                    !data.value.general ||
                    !data.value.general.update_timestamp ||
                    moment(data.value.general.update_timestamp).isBefore(moment().add(-refreshInterval.value, "millisecond"))
                ) {
                    if (refreshing.value > 0) {
                        console.log("Became visible with outdated data but already refreshing")
                    } else {
                        console.log("Became visible with outdated data - refresh")
                        timeUntilRefresh.value = 0
                    }
                }
            }
        })
    }

    return {
        data,
        transceivers,
        spy,
        airportByIcao,
        boundaries,
        traconBoundaries,
        bookings,
        movements,
        countMovements,
        refreshInterval,
        iAmOnline,
        isCidOnline,
        getAtises,
        getLocalControllers,
        isMatchingAirportCallsign,
        timeUntilRefresh,
        refreshing,
        fetchData,
        fetchTransceivers,
        fetchSpy,
        fetchBoundaries,
        fetchTraconBoundaries,
        fetchBookings,
    }
})
