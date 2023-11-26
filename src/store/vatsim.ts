// Utilities
import { defineStore } from "pinia"
import { ref, reactive } from "vue"
import axios from "axios"
import GeoJSON from "ol/format/GeoJSON"
import FeatureLike from "ol/Feature"

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
    // atis
    // controllers
    // facilities
    general: GeneralData
    // military_ratings
    // pilot_ratings
    pilots: Pilot[]
    prefiles: Prefile[]
    // ratings
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

export const useVatsimStore = defineStore("vatsim", () => {
    const data = ref({} as VatsimData)
    const transceivers = ref({} as { [key: string]: Transceiver[] })
    const spy = ref({} as VatspyData)
    const boundaries = ref([] as FeatureLike[])
    const traconBoundaries = ref([]as FeatureLike[])

    async function getData() {
        const response = await axios.get("https://data.vatsim.net/v3/vatsim-data.json")
        data.value = response.data as VatsimData
    }

    async function getTransceivers() {
        const response = await axios.get("https://data.vatsim.net/v3/transceivers-data.json")
        let xcs: { [key: string]: Transceiver[] } = {}
        for (const entry of response.data) {
            if (!(entry.callsign in xcs)) xcs[entry.callsign] = []
            for (const entryxc of entry.transceivers) {
                xcs[entry.callsign].push(entryxc as Transceiver)
            }
        }
        transceivers.value = xcs
    }

    async function getSpy() {
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
    }

    async function getBoundaries() {
        const response = await axios.get("https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/Boundaries.geojson")
        const features = new GeoJSON().readFeatures(response.data)
        // for (const feature of features) {
        //     const geometry = feature.getGeometry()
        //     if (geometry.intersectsCoordinate([19, 59])) {
        //         console.log("EUREKA", geometry, feature.getProperties())
        //     }
        // }
        boundaries.value = features
    }

    async function getTraconBoundaries() {
        const response = await axios.get("https://raw.githubusercontent.com/VATSIM-SSA/SSA-SimAware-Tracon-Project/main/TRACONBoundaries.geojson")
        const features = new GeoJSON().readFeatures(response.data)
        traconBoundaries.value = features
    }

    getData()
    getTransceivers()
    getSpy()
    getBoundaries()
    getTraconBoundaries()

    return { data, transceivers, spy, boundaries, traconBoundaries, getData, getTransceivers, getSpy, getBoundaries, getTraconBoundaries }
})
