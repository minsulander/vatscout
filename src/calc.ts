import moment from "moment"
import { Airport, FlightPlan, Pilot, useVatsimStore } from "./store/vatsim"
import * as turf from "@turf/turf"
import constants from "./constants"

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
    return distanceToAirport(pilot, vatsim.airportByIcao[pilot.flight_plan.departure])
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
    return distanceToAirport(pilot, vatsim.airportByIcao[pilot.flight_plan.arrival])
}

export function distanceToAirport(pilot: Pilot, airport: Airport) {
    if (!airport) return Infinity
    const from = turf.point([pilot.longitude, pilot.latitude])
    const to = turf.point([airport.longitude, airport.latitude])
    const distance = turf.distance(from, to) / 1.852
    return distance
}

export function eta(pilot: Pilot) {
    if (
        !pilot ||
        !pilot.longitude ||
        !pilot.latitude ||
        !pilot.flight_plan ||
        !pilot.flight_plan.arrival ||
        pilot.groundspeed < constants.inflightGroundspeed ||
        departureDistance(pilot) < constants.atAirportDistance
    )
        return undefined
    const vatsim = useVatsimStore()
    if (!vatsim.spy || !vatsim.spy.airports) return undefined
    const airport = vatsim.airportByIcao[pilot.flight_plan.arrival]
    if (!airport) return undefined
    const from = turf.point([pilot.longitude, pilot.latitude])
    const to = turf.point([airport.longitude, airport.latitude])
    const distance = turf.distance(from, to) / 1.852
    const seconds = (distance / pilot.groundspeed) * 3600

    // TODO could do some reasoning about groundspeed here... if less than x % of total distance, aircraft type, etc
    // for better ETA calculation in climb

    return moment().add(seconds, "seconds")
}

export function flightplanArrivalTime(fp: FlightPlan, adjustDepartureTime = false) {
    if (!fp.deptime || fp.deptime == "0000" || !fp.enroute_time || fp.enroute_time == "0000") return undefined
    let depHours = parseInt(fp.deptime.substring(0, 2))
    let depMinutes = parseInt(fp.deptime.substring(2, 4))
    if (adjustDepartureTime && flightplanDepartureTime(fp)?.isBefore(moment())) {
        depHours = moment().utc().get("hour")
        depMinutes = moment().utc().get("minute")
    }
    const enrHours = parseInt(fp.enroute_time.substring(0, 2))
    const enrMinutes = parseInt(fp.enroute_time.substring(2, 4))
    let arrHours = depHours + enrHours
    let arrMinutes = depMinutes + enrMinutes
    while (arrMinutes >= 60) {
        arrHours += 1
        arrMinutes -= 60
    }
    if (arrHours >= 24) arrHours -= 24
    let time = moment().utc().set("hour", arrHours).set("minute", arrMinutes)
    if (time.isBefore(moment())) time = time.add(1, "day")
    return time
}

export function flightplanDepartureTime(fp: FlightPlan) {
    if (!fp.deptime || fp.deptime == "0000" || !fp.enroute_time || fp.enroute_time == "0000") return undefined
    const depHours = parseInt(fp.deptime.substring(0, 2))
    const depMinutes = parseInt(fp.deptime.substring(2, 4))
    let time = moment().utc().set("hour", depHours).set("minute", depMinutes)
    if (time.isBefore(moment().subtract(12, "hour"))) time = time.add(1, "day")
    return time
}