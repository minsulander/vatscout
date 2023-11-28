// Utilities
import { defineStore } from "pinia"
import { ref, reactive } from "vue"
import axios from "axios"
import GeoJSON from "ol/format/GeoJSON"
import FeatureLike from "ol/Feature"
import constants from "@/constants"
import moment from "moment"
import { arrivalDistance, departureDistance } from "@/calc"

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
}

export interface FlightPlan {
    aircraft: string
    aircraft_faa: string
    aicraft_short: string
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
    const data = ref({} as VatsimData)
    const transceivers = ref({} as { [key: string]: Transceiver[] })
    const spy = ref({} as VatspyData)
    const boundaries = ref([] as FeatureLike[])
    const traconBoundaries = ref([] as FeatureLike[])
    const movements = ref({} as { [key: string]: AirportMovements })

    const timeUntilRefresh = ref(0)
    const refreshing = ref(0)

    function calculateMovements() {
        const start = new Date().getTime()
        const moves = {} as { [key: string]: AirportMovements }
        for (const pilot of data.value.pilots) {
            if (pilot.flight_plan) {
                if (pilot.flight_plan.departure) {
                    if (!(pilot.flight_plan.departure in moves)) moves[pilot.flight_plan.departure] = new AirportMovements()
                    if (pilot.groundspeed >= constants.inflightGroundspeed || departureDistance(pilot) >= constants.atAirportDistance)
                        moves[pilot.flight_plan.departure].departed++
                    else if (pilot.groundspeed < constants.inflightGroundspeed && departureDistance(pilot) < constants.atAirportDistance)
                        moves[pilot.flight_plan.departure].departing++
                }
                if (pilot.flight_plan.arrival) {
                    if (!(pilot.flight_plan.arrival in moves)) moves[pilot.flight_plan.arrival] = new AirportMovements()
                    if (pilot.groundspeed >= constants.inflightGroundspeed || arrivalDistance(pilot) >= constants.atAirportDistance)
                        moves[pilot.flight_plan.arrival].arriving++
                    else if (pilot.groundspeed < constants.inflightGroundspeed && arrivalDistance(pilot) < constants.atAirportDistance)
                        moves[pilot.flight_plan.arrival].arrived++
                }
            }
        }
        for (const prefile of data.value.prefiles) {
            if (prefile.flight_plan) {
                if (prefile.flight_plan.departure) {
                    if (!(prefile.flight_plan.departure in moves)) moves[prefile.flight_plan.departure] = new AirportMovements()
                    moves[prefile.flight_plan.departure].prefiledDepartures++
                }
                if (prefile.flight_plan.arrival) {
                    if (!(prefile.flight_plan.arrival in moves)) moves[prefile.flight_plan.arrival] = new AirportMovements()
                    moves[prefile.flight_plan.arrival].prefiledArrivals++
                }
            }
        }
        movements.value = moves
    }

    async function getData() {
        refreshing.value++
        try {
            const response = await axios.get("https://data.vatsim.net/v3/vatsim-data.json")
            data.value = response.data as VatsimData
            if (spy.value.airports && spy.value.airports.length > 0) calculateMovements()
        } finally {
            refreshing.value--
        }
    }

    async function getTransceivers() {
        refreshing.value++
        try {
            const response = await axios.get("https://data.vatsim.net/v3/transceivers-data.json")
            let xcs: { [key: string]: Transceiver[] } = {}
            for (const entry of response.data) {
                if (!(entry.callsign in xcs)) xcs[entry.callsign] = []
                for (const entryxc of entry.transceivers) {
                    xcs[entry.callsign].push(entryxc as Transceiver)
                }
            }
            transceivers.value = xcs
        } finally {
            refreshing.value--
        }
    }

    async function getSpy() {
        refreshing.value++
        try {
            const response = await axios.get("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/VATSpy.dat")
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
            if (data.value.pilots && data.value.pilots.length > 0) calculateMovements()
        } finally {
            refreshing.value--
        }
    }

    async function getBoundaries() {
        refreshing.value++
        try {
            const response = await axios.get(
                "https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson"
            )
            const features = new GeoJSON().readFeatures(response.data)
            // for (const feature of features) {
            //     const geometry = feature.getGeometry()
            //     if (geometry.intersectsCoordinate([19, 59])) {
            //         console.log("EUREKA", geometry, feature.getProperties())
            //     }
            // }
            boundaries.value = features
        } finally {
            refreshing.value--
        }
    }

    async function getTraconBoundaries() {
        refreshing.value++
        try {
            const response = await axios.get(
                "https://raw.githubusercontent.com/VATSIM-SSA/SSA-SimAware-Tracon-Project/main/TRACONBoundaries.geojson"
            )
            const features = new GeoJSON().readFeatures(response.data)
            traconBoundaries.value = features
        } finally {
            refreshing.value--
        }
    }

    if (!(window as any).refreshInterval) {
        ;(window as any).refreshInterval = setInterval(() => {
            timeUntilRefresh.value -= 500
            if (timeUntilRefresh.value <= 0) {
                timeUntilRefresh.value = constants.refreshInterval
                if (document.visibilityState == "visible") {
                    getData()
                    getTransceivers()
                    // TODO get spy, boundaries, traconboundaries at lower interval
                    if (!spy.value.countries) setTimeout(() => getSpy(), 500)
                    if (boundaries.value.length == 0) setTimeout(() => getBoundaries(), 1000)
                    if (traconBoundaries.value.length == 0) setTimeout(() => getTraconBoundaries(), 1500)
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
        movements,
        timeUntilRefresh,
        refreshing,
        getData,
        getTransceivers,
        getSpy,
        getBoundaries,
        getTraconBoundaries,
    }
})
