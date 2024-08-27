import { describe, expect, test } from "vitest"
import { extractCallsign, extractRunwayInUseFromAtisText } from "../src/common"
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

    test("extract runway in use undefined from bogus", () => {
        const riu = extractRunwayInUseFromAtisText("BLAH")
        expect(riu).toBeUndefined()
    })

    // Parse dem ATISes

    test("extract runway in use EBCI", () => {
        const riu = extractRunwayInUseFromAtisText("CHARLEROI INFORMATION D 0650 EXPECT VECTORING FOR ILS APPROACH RUNWAY 24 FOR ARRIVALS AND DEPARTURES TRANSITION LEVEL 55 WIND VARIABLE 2 KNOTS CAVOK TEMPERATURE 15 DEW POINT 11 QNH 1022 CONFIRM INFORMATION D ON FIRST CONTACT")
        expect(riu).toBe("24")
    })

    test("extract runway in use LTBJ", () => {
        const riu = extractRunwayInUseFromAtisText("LTBJ ATIS INFORMATION B, 0650Z. RWY 34R, EXP ILS Y APCH RWY 34R, TRANSITION LEVEL 115, 01006KT 330V040 9999 FEW030 28/16 Q1009, RWY 16R/34L CLSD. DEP TFC, INTXN J IS MANDATORY, REPORT IF UNABLE TO EXECUTE INTXN DEPS., END OF ATIS INFORMATION, B.")
        expect(riu).toBe("34R")
    })

    test("extract runway in use KPDX", () => {
        const riu = extractRunwayInUseFromAtisText("KPDX ATIS INFO B 0653Z. 30005KT 10SM SCT250 19/12 A3014 (THREE ZERO ONE FOUR). SIMUL VIS APCHS IN USE RWYS 28L AND 28R. DEPTG RWYS 28L AND 28R. NOTAMS... PUSHBACK ONTO TWYS T AND K REQS ATC CLNC.....ADVS YOU HAVE INFO B")
        expect(riu).toBe("28B")
    })

    test("extract runway in use NZAA", () => {
        const riu = extractRunwayInUseFromAtisText("ATIS NZAA P 270713\n+[ISSUED AT] 0713 ZULU\n[EXPECT] ILS DME APCH\n[RWY] 23L\n[RWY COND] DRY\n+[SFC WIND] 280/10\n[VIS] GT 10KM\n+[CLD] FEW025, SCT033\n+[TMP] 15\n+[DP] 12\n[QNH] 1014")
        expect(riu).toBe("23L")
    })

    test("extract runway in use YSSY", () => {
        const riu = extractRunwayInUseFromAtisText("ATIS YSSY I 270712\n[APCH] EXP INST APCH\n[RWY] 34L AND R FOR ARRIVALS AND DEPS\n[OPR INFO] INDEPENDENT PARALLEL DEPARTURES AND ARRIVALS IN PROGRESS\n+[WIND] 030/9\n[WX] CAVOK\n+[TMP] 21\n[QNH] 1014")
        expect(riu).toBe("34B")
    })

    test("extract runway in use VHHH", () => {
        let riu = extractRunwayInUseFromAtisText("HONG KONG INFORMATION V AT TIME 0730 DEPARTURE RUNWAY 25L WIND 220 DEGREES 7 KNOTS VARIABLE BETWEEN 170 AND 240 DEGREES VISIBILITY MORE THAN 10 KILOMETERS FEW AT 2500 FEET TEMPERATURE 35 DEGREES DEW POINT 24 DEGREES QNH 1003 NOSIG ACKNOWLEDGE INFORMATION V ON FIRST CONTACT")
        expect(riu).toBe("25L")
        riu = extractRunwayInUseFromAtisText("HONG KONG INFORMATION J AT TIME 0730 ARRIVAL RUNWAY 25L RUNWAY 25R WIND 220 DEGREES 7 KNOTS VARIABLE BETWEEN 170 AND 240 DEGREES VISIBILITY MORE THAN 10 KILOMETERS FEW AT 2500 FEET TEMPERATURE 35 DEGREES DEW POINT 24 DEGREES QNH 1003 NOSIG ACKNOWLEDGE INFORMATION J ON FIRST CONTACT")
        expect(riu).toBe("25B")
    })

    test("extract runway in use LOWW", () => {
        let riu = extractRunwayInUseFromAtisText("THIS IS WIEN-SCHWECHAT DEPARTURE INFORMATION GOLF , AT 0720 DEPARTURE RUNWAY 29 AND RUNWAY 34 TRAFFIC VIA ADAMA BUWUT KOXER LANUX LEDVA EXPECT RUNWAY 34 ARRIVAL RUNWAY 34 TRANSITION LEVEL 110 WIND 320 DEGREES 10 KNOTS CAVOK TEMPERATURE 21 DEW POINT 15 QNH 1022 NOSIG")
        expect(riu).toBe("29/34")
        riu = extractRunwayInUseFromAtisText("THIS IS WIEN-SCHWECHAT ARRIVAL INFORMATION GOLF , AT 0720 ARRIVAL RUNWAY 34 ILS TRANSITION LEVEL 110 WIND 320 DEGREES 10 KNOTS CAVOK TEMPERATURE 21 DEW POINT 15 QNH 1022 NOSIG")
        expect(riu).toBe("34")
    })

    test("extract runway in use EGCC", () => {
        const riu = extractRunwayInUseFromAtisText("MANCHESTER INFORMATION B, TIME 0750Z AUTOMATIC. RUNWAY IN USE RWY 23R. SINGLE RUNWAY OPERATIONS. TRANSITION LEVEL 60. 19008KT 140V220 CAVOK 16/13 Q1014. ...ADVS YOU HAVE INFO B")
        expect(riu).toBe("23R")
    })

    test("extract runway in use EGPH", () => {
        const riu = extractRunwayInUseFromAtisText("EDINBURGH INFORMATION A, TIME 0720Z RUNWAY IN USE 24. TRANSITION LEVEL 75. EXPECT RADAR VECTORING TO AN ILS APPROACH. 21020G30KT 8000 -RA BKN037 17/14 QNH 1005 (ONE ZERO ZERO FIVE). DO NOT REQUEST PUSHBACK UNTIL THE TUG IS CONNECTED. ACKNOWLEDGE RECEIPT OF INFORMATION A AND ADVISE AIRCRAFT TYPE ON FIRST CONTACT.")
        expect(riu).toBe("24")
    })

    test("extract runway in use ENBR", () => {
        const riu = extractRunwayInUseFromAtisText("THIS IS FLESLAND INFORMATION TANGO .. TIME 0720 .. EXPECT ILS WHISKEY APPROACH .. RUNWAY IN USE 17 .. TRANSITION LEVEL 80 .. FOR EN-ROUTE CLEARANCE REQUEST VIA DATALINK OR CONTACT GROUND 121.9 .. WIND 130 DEGREES 11 KNOTS .. VISIBILITY 10 KILOMETERS OR MORE .. CLOUDS SCT 4500 FT BKN 7000 FT .. TMP 13 DP 10 .. QNH 1016 .. NOSIG .. REMARK WIND 1200FT 140 DEGREES 22 KNOTS.")
        expect(riu).toBe("17")
    })

    test("extract runway in use UNKL", () => {
        const riu = extractRunwayInUseFromAtisText("EMELYANOVO ATIS INFORMATION C 0730Z EXPECT ILS ZULU APPROACH RUNWAY 29 DRY FRICTION COEFFICIENT DECIMAL 65 MEASURED BY SFT DEPARTURE RUNWAY 29 TRANSITION LEVEL 90 DEPARTURE FREQUENCY 127,700 BIRD STRIKE HAZARD IN VICINITY OF AERODROME WEATHER WIND 230 DEGREES 4 METRES PER SECOND VISIBILITY GREATER THAN 10 KILOMETRES CLOUDS SCATTERED CUMULONIMBUS 1290 METRES TEMPERATURE 20 DEW POINT 11 QNH 1011 NO SIGNIFICANT CHANGES ACKNOWLEDGE ATIS INFORMATION C")
        expect(riu).toBe("29")
    })

    test("extract runway in use ZSPD", () => {
        const riu = extractRunwayInUseFromAtisText("ZSPD ATIS B 0753Z DEP RWY 34L AND 35R EXP ILS ARR RWY 34R AND 35L WIND 320 DEG 08 MPS VIS 5000 M -TSRA FEW 900MCB TEMP 26 DEW POINT 25 QNH 1002 HPA TRANSITION LEVEL 3600 M ALL RWYS RWY CONDITION CODE 5 5 5 ISSUED AT 0753Z ALL PARTS WET DEPTH NOT REPORTED COVERAGE 100PCT REPORT RECEIPT OF ATIS B ON ZSPD")
        expect(riu).toBe("34L")
    })

    test("extract runway in use LTFM", () => {
        let riu = extractRunwayInUseFromAtisText("LTFM ARR ATIS INFORMATION P, 0720Z. EXP ILS X APCH 35R, EXP ILS Y APCH 36. TRANSITION LEVEL 130, SIMULTANEOUS INDEPENDENT PARALLEL ILS APCHS IN PROGRESS ON RWYS 35R AND 36. 06018KT 9999 FEW017 BKN022 27/20 Q1013,, AFTER VACATING RWY CTC 124.725, END OF ARR ATIS INFORMATION, P.")
        expect(riu).toBe("35R")
        riu = extractRunwayInUseFromAtisText("LTFM DEP ATIS INFORMATION C, 0720Z. DEP RWYS, 35L, AND, 36. INDEPENDENT PARALEL DEPS IN PROGRESS, CAUT BIRD ACTIVITY, AIRBORNE FREQ 133.225. CAUT DEPTG TFC RWY 18 AND 36 HS OF CAT 2 AND CAT 3 HOLDING, 06018KT 9999 FEW017 BKN022 27/20 Q1013.. RECIEVE DEP CLNC VIA DATALINK ON ACARS, END OF DEP ATIS INFORMATION, C.")
        expect(riu).toBe("35L")
    })

    test("extract runway in use ESSA", () => {
        let riu = extractRunwayInUseFromAtisText("ESSA ARR ATIS A. TIME 0750Z. ILS RWY 19L IN USE. DEP RWY 19R. TWY X CLSD BTN ZL AND ZN DUE WIP. TWY Z CLSD BTN ZQ AND ZT DUE WIP. RWY 08/26 CLSD DUE WIP TRL 60. MET REPORT WIND 240/12KT VIS 10KM CLD FEW027 T16/DP10 QNH 1020 HPA.")
        expect(riu).toBe("19L")
        riu = extractRunwayInUseFromAtisText("ESSA DEP ATIS A. TIME 0750Z. RWY 19R IN USE. ARR RWY 19L. TWY X CLSD BTN ZL AND ZN DUE WIP. TWY Z CLSD BTN ZQ AND ZT DUE WIP. RWY 08/26 CLSD DUE WIP MET REPORT WIND 240/12KT VIS 10KM CLD FEW027 T16/DP10 QNH 1020 HPA.")
        expect(riu).toBe("19R")
    })

    test("extract runway in use EDDV", () => {
        const riu = extractRunwayInUseFromAtisText("HANNOVER INFORMATION C. MET REPORT TIME 0850Z. WHEN AIRBORNE CONTACT BREMEN RADAR ON 119.490. EXPECT RADAR VECTORS. RUNWAYS IN USE 09L AND 09R. DEPENDENT PARALLEL APPROACHES IN PROGRESS. REPORT PREFERRED RUNWAY ON INITIAL CONTACT.. TRANSITION LEVEL 60... 14004KT 080V250 CAVOK 21/12 QNH 1024. HANNOVER INFORMATION C OUT.")
        expect(riu).toBe("09B")
    })

    

})
