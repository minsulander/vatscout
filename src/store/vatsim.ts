import { defineStore } from "pinia"
import { ref, reactive } from "vue"
import axios from "axios"
import GeoJSON from "ol/format/GeoJSON"
import FeatureLike from "ol/Feature"
import constants from "@/constants"
import moment from "moment"
import { arrivalDistance, departureDistance, eta, flightplanArrivalTime, flightplanDepartureTime } from "@/calc"
import { useSettingsStore } from "./settings"

const apiBaseUrl = "https://api.vatscout.com"

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
    departing: number = 0
    prefiledDepartures: number = 0
    arrived: number = 0
    arriving: number = 0
    prefiledArrivals: number = 0

    get departures() {
        return this.departed + this.departing + this.prefiledDepartures
    }

    get arrivals() {
        return this.arrived + this.arriving + this.prefiledArrivals
    }

    get total() {
        return this.departures + this.arrivals
    }

    get pending() {
        return this.departing + this.prefiledDepartures + this.arriving + this.prefiledArrivals
    }
}

export const useVatsimStore = defineStore("vatsim", () => {
    const settings = useSettingsStore()

    const data = ref({} as VatsimData)
    const transceivers = ref({} as { [key: string]: Transceiver[] })
    const spy = ref({} as VatspyData)
    const boundaries = ref([] as FeatureLike[])
    const traconBoundaries = ref([] as FeatureLike[])
    const bookings = ref([] as Booking[])
    const timeUntilRefresh = ref(0)
    const refreshing = ref(0)

    let cachedMovements = {} as { [key: string]: AirportMovements }

    function getMovements(airport_icao: string) {
        if (airport_icao in cachedMovements) return cachedMovements[airport_icao]
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
            }
            if (p.flight_plan.arrival == airport_icao) {
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
            }
            if (
                p.flight_plan.arrival == airport_icao &&
                (!flightplanArrivalTime(p.flight_plan) ||
                    flightplanArrivalTime(p.flight_plan)?.isBefore(moment().add(settings.arrivingMaxMinutes, "minute"))) &&
                (!flightplanDepartureTime(p.flight_plan) ||
                    flightplanDepartureTime(p.flight_plan)?.isAfter(moment().subtract(settings.prefileMaxTardinessMinutes, "minute")))
            ) {
                moves.prefiledArrivals++
            }
        }
        cachedMovements[airport_icao] = moves
        return moves
    }

    async function fetchData() {
        refreshing.value++
        try {
            const startRequest = new Date().getTime()
            const response = await axios.get(`${apiBaseUrl}/data`)
            data.value = response.data as VatsimData
            if (spy.value.airports && spy.value.airports.length > 0) cachedMovements = {}
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
            let xcs: { [key: string]: Transceiver[] } = {}
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
            // for (const feature of features) {
            //     const geometry = feature.getGeometry()
            //     if (geometry.intersectsCoordinate([19, 59])) {
            //         console.log("EUREKA", geometry, feature.getProperties())
            //     }
            // }
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
            const response = await axios.get(`${apiBaseUrl}/tracon-boundaries`)
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

    async function fetchEvents() {}

    if (!(window as any).refreshInterval) {
        ;(window as any).refreshInterval = setInterval(() => {
            timeUntilRefresh.value -= 500
            if (timeUntilRefresh.value <= 0) {
                timeUntilRefresh.value = constants.refreshInterval
                if (document.visibilityState == "visible") {
                    fetchData()
                    fetchTransceivers()
                    // TODO get spy, boundaries, traconboundaries at lower interval
                    if (!spy.value.countries) setTimeout(() => fetchSpy(), 200)
                    if (boundaries.value.length == 0) setTimeout(() => fetchBoundaries(), 400)
                    if (traconBoundaries.value.length == 0) setTimeout(() => fetchTraconBoundaries(), 600)
                    if (bookings.value.length == 0) setTimeout(() => fetchBookings(), 800)
                } else {
                    console.log("Not refreshing - not visible")
                }
            }
        }, 500)
        document.addEventListener("visibilitychange", (event) => {
            if (document.visibilityState == "visible") {
                if (
                    !data.value.general ||
                    !data.value.general.update_timestamp ||
                    moment(data.value.general.update_timestamp).isBefore(moment().add(-constants.refreshInterval, "millisecond"))
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
        boundaries,
        traconBoundaries,
        bookings,
        getMovements,
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
