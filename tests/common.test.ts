import { describe, expect, test } from "vitest"
import { extractCallsign } from "../src/common"
import { FlightPlan, Pilot } from "../src/store/vatsim"

describe("common functions", () => {
    test("extract callsign", () => {
        const callsign = extractCallsign({ callsign: "DFL5995" } as Pilot)
        expect(callsign).toBe("MEDIFLIGHT 5995")
    })
    test("extract callsign from remarks CS/", () => {
        const callsign = extractCallsign({ callsign: "MED5995", flight_plan: { remarks: "RMK/BLAH CS/MEDIFLIGHT /V/" } } as Pilot)
        expect(callsign).toBe("MEDIFLIGHT 5995")
    })
    test("extract callsign from remarks CS/ with numbers", () => {
        const callsign = extractCallsign({ callsign: "MED5995", flight_plan: { remarks: "RMK/BLAH CS/MEDIFLIGHT 5995 /V/" } } as Pilot)
        expect(callsign).toBe("MEDIFLIGHT 5995")
    })
    test("extract callsign from remarks CALLSIGN IS with numbers", () => {
        const callsign = extractCallsign({ callsign: "FRW495", flight_plan: { remarks: "DOF/240108 RMK/BBJ/ CALLSIGN IS FREEWINGS 495 /V/" } } as Pilot)
        expect(callsign).toBe("FREEWINGS 495")
    })
    test("extract callsign from remarks CALLSIGN with numbers no space", () => {
        const callsign = extractCallsign({ callsign: "MED5995", flight_plan: { remarks: "PBN/B2C2D2S2 SUR/B1S DOF/240114 REG/SE-JSM OPR/DFL RMK//CALLSIGN MEDIFLIGHT5995 /V/" } } as Pilot)
        expect(callsign).toBe("MEDIFLIGHT 5995")
    })
    test("extract callsign from remarks CALLSIGN//", () => {
        const callsign = extractCallsign({ callsign: "UKA914", flight_plan: { remarks: "PBN/B2B3B4D2S1 DOF/240120 REG/GBTTP EET/EBUR0018 EDVV0041 EDUU0042 EDGG0102 EDMM0105 OPR/UKA PER/C RMK/SIMBRIEF CALLSIGN//UKAY /V/" } } as Pilot)
        expect(callsign).toBe("UKAY 914")
    })


})
