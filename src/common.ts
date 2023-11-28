import { Controller } from "./store/vatsim"

export function colorForController(controller: Controller) {
    if (controller.callsign.endsWith("DEL")) return "blue-darken-3"
    if (controller.callsign.endsWith("GND")) return "green-darken-3"
    if (controller.callsign.endsWith("TWR")) return "red-darken-3"
    if (controller.callsign.endsWith("DEP")) return "purple-darken-3"
    if (controller.callsign.endsWith("APP")) return "cyan-darken-3"
    if (controller.callsign.endsWith("CTR")) return "grey-darken-3"
    return "grey"
}

export function labelForController(controller: Controller) {
    const underscore = controller.callsign.lastIndexOf("_")
    if (underscore >= 0) {
        return controller.callsign.substring(underscore + 1)
    }
    return controller.callsign
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