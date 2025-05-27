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
        m = text.match(new RegExp(`(ATIS|ARRIVAL|DEPARTURE|ARR|DEP|ARR AND DEP) (INFORMATION|INFO) (\\w)`))
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
        m = text.match(new RegExp(`^\\w+ INFORMATION (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`^\\w+ \\w+ INFORMATION (\\w)`))
        if (m) return m.at(1)
        m = text.match(new RegExp(`^\\w+ ATIS (\\w) TIME`))
        if (m) return m.at(1)
    }
}

export function extractRunwayInUse(atis: Atis) {
    if (atis.text_atis && atis.text_atis.length > 0) return extractRunwayInUseFromAtisText(atis.text_atis.join(" ").trim())
}

export function extractRunwayInUseFromAtisText(text: string) {
    // returns e.g. "25B"" for "25L AND R", or "29/34" for "29 AND 34"

    let m = undefined
    // order from most specific to least specific
    m = text.match(/(RUNWAYS IN USE|RUNWAYS|RWYS|RUNWAY|RWY)[\s\]:]+(\d+)[LRC] AND (\d+)[LRC]/) // EDDV and KPDX dual runways "both"
    if (m && m[2] && m[3] && m[2] == m[3]) return `${m[2]}B`
    m = text.match(/(RUNWAYS IN USE)[\s\]:]+(\d+[LRC]?) AND (\d+[LRC]?)/) // EDDF dual runways "/"
    if (m && m[2] && m[3]) return `${m[2]}/${m[3]}`
    m = text.match(/\s+(DEPARTURE|DEP|ARRIVAL|ARR)\s+(RUNWAY|RWY)\s+(\d+[LRC]?)\s+(AND RUNWAY|RUNWAY|AND RWY|RWY)\s+(\d+[LRC]?)/) // VHHH and LOWW dual runways
    if (m && m[3] && m[5]) return m[3].substring(0,2) == m[5].substring(0,2) ? `${m[3].substring(0,2)}B` : `${m[3]}/${m[5]}`
    m = text.match(/\[RWY\] (\d+)[LRC] AND [LRC]/) // YSSY dual runways
    if (m && m[1]) return `${m[1]}B`
    m = text.match(/\s+(RUNWAY IN USE FOR LANDING|RUNWAY IN USE FOR TAKEOFF)\s+(\d+)\s+(LEFT|RIGHT|)/) // EKCH danish pastry style
    if (m && m[2]) return m[2] + (m[3] == "LEFT" ? "L" : m[3] == "RIGHT" ? "R" : "")
    m = text.match(/\[RWY\] (\d+[LRC])/) // NZAA
    if (m && m[1]) return `${m[1]}`
    m = text.match(/\s+(RUNWAY|RWY)\s+(\d+[LRC]?)\s+(IN USE|FOR ARRIVAL)/)
    if (m && m[2]) return m[2]
    m = text.match(/\s+(RUNWAY IN USE|RUNWAYS IN USE|RWY IN USE|RUNWAY IN USE RWY|RUNWAY IN USE RUNWAY|RWY IN USE RUNWAY)\s+(\d+[LRC]?)/)
    if (m && m[2]) return m[2]
    m = text.match(/\s+(DEPARTURE|DEP|ARRIVAL|ARR|LDG)\s+(RUNWAY|RWY|RUNWAYS|RWYS)[\s,:]+(\d+[LRC]?)/)
    if (m && m[3]) return m[3]
    m = text.match(/\s+(EXPECT|EXP)\s+.*?\s+(RUNWAY|RWY|APCH)\s+(\d+[LRC]?)/)
    if (m && m[3]) return m[3]
    m = text.match(/\s+(APCH IN USE)\s+.*?\s+(RY)\s+(\d+[LRC]?)/) // KJFK
    if (m && m[3]) return m[3]
    m = text.match(/\s+RWY\s+(\d+[LRC]?)\s+APCH IN USE/) // KISP
    if (m && m[1]) return m[1]
    m = text.match(/(ILS|LOC|RNP|VOR|NDB) APCH RWY\s+(\d+[LRC]?)\s+/) // ES* new/old? format
    if (m && m[2]) return m[2]


    return undefined
}

export function extractCallsign(p: Pilot | Prefile) {
    const flightplan = p.flight_plan
    if (flightplan && (flightplan.remarks.includes("CALLSIGN") || flightplan.remarks.includes("CS/") || flightplan.remarks.includes("C/S"))) {
        const m = flightplan.remarks.match(/(\WCALLSIGN IS |\WCALLSIGN[/=_ ]+|\WC\/S[=_ ]|\WCS\/)([\w\s-_"]+?)(TCAS|SIMBRIEF|\s\w+\/|[,\.\/\(]|$)/)
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

