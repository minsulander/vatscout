import { Controller } from "./store/vatsim"

export function colorForController(controller: Controller) {
    return colorForControllerCallsign(controller.callsign) || "grey"
}

export function colorForControllerCallsign(callsign: string) {
    if (callsign.endsWith("DEL")) return "blue-darken-3"
    if (callsign.endsWith("GND")) return "green-darken-3"
    if (callsign.endsWith("TWR")) return "red-darken-3"
    if (callsign.endsWith("DEP")) return "purple-darken-3"
    if (callsign.endsWith("APP")) return "cyan-darken-3"
    if (callsign.endsWith("CTR")) return "grey-darken-1"
}

export function labelForController(controller: Controller) {
    return labelForControllerCallsign(controller.callsign) || controller.callsign
}

export function labelForControllerCallsign(callsign: string) {
    const underscore = callsign.lastIndexOf("_")
    if (underscore >= 0) {
        return callsign.substring(underscore + 1)
    }
}

export function compareControllers(a: Controller, b: Controller) {
    let aOrder = 999, bOrder = 999
    const suffixes = [ "DEL", "GND", "TWR", "DEP", "APP", "CTR" ]
    for (let i = 0; i < suffixes.length; i++) {
        if (a.callsign.endsWith(suffixes[i])) aOrder = i
        if (b.callsign.endsWith(suffixes[i])) bOrder = i
    }
    return aOrder > bOrder ? 1 : -1
}
