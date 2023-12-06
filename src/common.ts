import { Atis, Controller } from "./store/vatsim"

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
    return compareCallsigns(a.callsign, b.callsign)
}

export function compareCallsigns(a: string, b: string) {
    let aOrder = 999, bOrder = 999
    const suffixes = [ "DEL", "GND", "TWR", "DEP", "APP", "CTR" ]
    for (let i = 0; i < suffixes.length; i++) {
        if (a.endsWith(suffixes[i])) aOrder = i
        if (b.endsWith(suffixes[i])) bOrder = i
    }
    return aOrder == bOrder ? 0 : aOrder > bOrder ? 1 : -1
}

export function extractAtisCode(atis: Atis) {
    if (atis.text_atis && atis.text_atis.length > 0) {
        const text = atis.text_atis.join(" ").trim()
        const icao = atis.callsign.substring(0,4)
        let m = text.match(new RegExp(`${icao}( ARR| DEP|) ATIS( INFO| INFORMATION|) (\\w)[ \\.]`))
        if (m) return m.at(3)
        m = text.match(new RegExp(`${icao} INFORMATION (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`(ATIS|ARRIVAL|DEPARTURE|ARR AND DEP) (INFORMATION|INFO) (\\w)`))
        if (m) return m.at(3)
        m = text.match(new RegExp(`THIS IS \\w+ INFORMATION (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`INFORMATION (\\w) OUT ?\\.?$`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`END OF INFORMATION (\\w)\\w* ?\\.?$`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`ADV\\w+ YOU HAVE INF\\w+ (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`ACK\\w+ RECEIPT OF INF\\w+ (\\w)`))
        if (m) return m.at(1)
    }
}