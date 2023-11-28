import moment from "moment"
import { Pilot, useVatsimStore } from "./store/vatsim"
import * as turf from "@turf/turf"
import constants from "./constants"

export function eta(pilot: Pilot) {
    if (
        !pilot ||
        !pilot.longitude ||
        !pilot.latitude ||
        !pilot.flight_plan ||
        !pilot.flight_plan.arrival ||
        pilot.groundspeed < constants.inflightGroundspeed
    )
        return undefined
    const vatsim = useVatsimStore()
    if (!vatsim.spy || !vatsim.spy.airports) return undefined
    const airport = vatsim.spy.airports.find((a) => a.icao == pilot.flight_plan.arrival)
    if (!airport) return undefined
    const from = turf.point([pilot.longitude, pilot.latitude])
    const to = turf.point([airport.longitude, airport.latitude])
    const distance = turf.distance(from, to) / 1.852
    const seconds = (distance / pilot.groundspeed) * 3600

    // TODO could do some reasoning about groundspeed here... if less than x % of total distance, aircraft type, etc
    // for better ETA calculation in climb

    return moment().add(seconds, "seconds")
}

export function departureDistance(pilot: Pilot) {
    if (
        !pilot ||
        !pilot.longitude ||
        !pilot.latitude ||
        !pilot.flight_plan ||
        !pilot.flight_plan.departure
    )
        return Infinity
    const vatsim = useVatsimStore()
    if (!vatsim.spy || !vatsim.spy.airports) return Infinity
    const airport = vatsim.spy.airports.find((a) => a.icao == pilot.flight_plan.departure)
    if (!airport) return Infinity
    const from = turf.point([pilot.longitude, pilot.latitude])
    const to = turf.point([airport.longitude, airport.latitude])
    const distance = turf.distance(from, to) / 1.852
    return distance
}

export function arrivalDistance(pilot: Pilot) {
    if (
        !pilot ||
        !pilot.longitude ||
        !pilot.latitude ||
        !pilot.flight_plan ||
        !pilot.flight_plan.arrival
    )
        return Infinity
    const vatsim = useVatsimStore()
    if (!vatsim.spy || !vatsim.spy.airports) return Infinity
    const airport = vatsim.spy.airports.find((a) => a.icao == pilot.flight_plan.arrival)
    if (!airport) return Infinity
    const from = turf.point([pilot.longitude, pilot.latitude])
    const to = turf.point([airport.longitude, airport.latitude])
    const distance = turf.distance(from, to) / 1.852
    return distance
}

