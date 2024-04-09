import callsigns from "@/data/callsigns.json"
import { Atis, Controller, Pilot, Prefile } from "./store/vatsim"

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
    let aOrder = 999,
        bOrder = 999
    const suffixes = ["DEL", "GND", "TWR", "DEP", "APP", "CTR"]
    for (let i = 0; i < suffixes.length; i++) {
        if (a.endsWith(suffixes[i])) aOrder = i
        if (b.endsWith(suffixes[i])) bOrder = i
    }
    return aOrder == bOrder ? 0 : aOrder > bOrder ? 1 : -1
}

export function extractAtisCode(atis: Atis) {
    if (atis.text_atis && atis.text_atis.length > 0) {
        const text = atis.text_atis.join(" ").trim()
        const icao = atis.callsign.substring(0, 4)
        let m = text.match(new RegExp(`${icao}( ARR| DEP|) ATIS( INFO| INFORMATION|) (\\w)[ \\.]`))
        if (m) return m.at(3)
        m = text.match(new RegExp(`${icao} INFORMATION (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`(ATIS|ARRIVAL|DEPARTURE|ARR AND DEP) (INFORMATION|INFO) (\\w)`))
        if (m) return m.at(3)
        m = text.match(new RegExp(`THIS IS \\w+ INFORMATION (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`INFORMATION (\\w) OUT([ .]|$)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`END OF INFORMATION (\\w)\\w* ?\\.?$`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`ADV\\w+ YOU HAVE INF\\w+ (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`ACK\\w+ RECEIPT OF INF\\w+ (\\w)`))
        if (m) return m.at(1)
    }
}

export function extractCallsign(p: Pilot | Prefile) {
    const flightplan = p.flight_plan
    if (flightplan && (flightplan.remarks.includes("CALLSIGN") || flightplan.remarks.includes("CS/"))) {
        const m = flightplan.remarks.match(/(CALLSIGN IS |CALLSIGN[/=_ ]+|CS\/)([\w\s-_"]+?)(TCAS|SIMBRIEF|\s\w+\/|[,\.\/\(]|$)/)
        if (m && m.at(2)) {
            const remarkCallsign = m.at(2)?.replaceAll('"', "").trim()
            if (remarkCallsign) {
                if (p.callsign.length > 3 && isFinite(parseInt(p.callsign.substring(3, 4)))) {
                    const numbers = p.callsign.substring(3)
                    if (remarkCallsign.endsWith(" " + numbers)) return remarkCallsign
                    else if (remarkCallsign.endsWith(numbers)) return remarkCallsign.replace(numbers, "") + " " + numbers
                    else return `${remarkCallsign} ${numbers}`
                }
                return remarkCallsign
            }
        }
    }
    if (p.callsign.length > 3 && isFinite(parseInt(p.callsign.substring(3, 4)))) {
        const longCallsign = (callsigns as any)[p.callsign.substring(0, 3)]
        const numbers = p.callsign.substring(3)
        if (longCallsign && numbers) return `${longCallsign} ${numbers}`
    }
    return p.callsign
}

export function isStandaloneApp() {
    return (navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches
}

export function minutes2hhmm(minutes: number) {
    const hours = Math.floor(minutes/60)
    const mins = minutes - hours*60
    return `${String(hours).padStart(2, "0")}${String(mins).padStart(2, "0")}`
}

export function hhmm2minutes(hhmm: string) {
    const hours = parseInt(hhmm.substring(0,2))
    const minutes = parseInt(hhmm.substring(2,4))
    return hours*60+minutes
}

