<template>
    <v-text-field
        variant="underlined"
        placeholder="Search"
        ref="siracha"
        v-model="search"
        autofocus
        :error-messages="errorMessages"
        @input="input"
        @keyup.enter="enter"
        @keyup.esc="esc"
    />
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
const router = useRouter()
const search = ref("")
const vatsim = useVatsimStore()

const errorMessages = ref("")

function input() {
    errorMessages.value = ""
}

function esc() {
    search.value = ""
    errorMessages.value = ""
}

function enter() {
    const query = search.value.toUpperCase()
    if (query.length == 0) {
        errorMessages.value = ""
        return
    }
    search.value = ""
    // Exact matches
    if (vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find((p) => p.callsign == query)) return router.push(`/flight/${query}`)
    if (vatsim.data && vatsim.data.prefiles && vatsim.data.prefiles.find((p) => p.callsign == query)) return router.push(`/flight/${query}`)
    if (query in vatsim.airportByIcao) return router.push(`/airport/${query}`)
    if (vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == query)) return router.push(`/fir/${query}`)
    if (vatsim.spy && vatsim.spy.uirs && vatsim.spy.uirs.find((u) => u.id == query)) return router.push(`/uir/${query}`)
    if (vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find((c) => c.prefix == query)) return router.push(`/country/${query}`)
    // Exact matches on IATA etc
    if (vatsim.spy && vatsim.spy.airports) {
        const airport = vatsim.spy.airports.find((a) => a.iata && a.iata == query)
        if (airport && airport.icao) return router.push(`/airport/${airport.icao}`)
    }
    // Partial matches
    const shortPilot =
        query.length == 3 &&
        vatsim.data &&
        vatsim.data.pilots &&
        vatsim.data.pilots.find((p) => `${p.callsign.substring(0, 1)}${p.callsign.substring(3)}` == query)
    if (shortPilot) return router.push(`/flight/${shortPilot.callsign}`)
    // const iataAirport = vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.find((a) => a.iata == query)
    // if (iataAirport) return router.push(`/airport/${iataAirport.icao}`)
    const endsPilot = vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find((p) => p.callsign.endsWith(query))
    if (endsPilot) return router.push(`/flight/${endsPilot.callsign}`)
    const endsPrefile = vatsim.data && vatsim.data.prefiles && vatsim.data.prefiles.find((p) => p.callsign.endsWith(query))
    if (endsPrefile) return router.push(`/flight/${endsPrefile.callsign}`)
    const startsPilot = vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find((p) => p.callsign.startsWith(query))
    if (startsPilot) return router.push(`/flight/${startsPilot.callsign}`)
    const startsPrefile = vatsim.data && vatsim.data.prefiles && vatsim.data.prefiles.find((p) => p.callsign.startsWith(query))
    if (startsPrefile) return router.push(`/flight/${startsPrefile.callsign}`)
    // Name matches
    if (vatsim.spy && vatsim.spy.countries && vatsim.spy.airports) {
        const country = vatsim.spy.countries.find((c) => c.name && c.name.toUpperCase().includes(query))
        if (country && country.prefix) return router.push(`/country/${country.prefix}`)
        const airport = vatsim.spy.airports.find((a) => a.name && a.name.toUpperCase().includes(query))
        if (airport && airport.icao) return router.push(`/airport/${airport.icao}`)
    }
    if (vatsim.data && vatsim.data.pilots) {
        const pilot = vatsim.data.pilots.find((p) => p.name.toUpperCase().includes(query) || query == `${p.cid}`)
        if (pilot) {
            if (pilot.callsign) return router.push(`/flight/${pilot.callsign}`)
            if (query == `${pilot.cid}`) return router.push(`/member/${pilot.cid}`)
        }
    }
    if (vatsim.data && vatsim.data.controllers) {
        const controller = vatsim.data.controllers.find(
            (c) => c.name.toUpperCase().includes(query) || query == `${c.cid}` || query == c.callsign
        )
        if (controller && controller.callsign) {
            const icao = controller.callsign.substring(0, 4)
            if (icao in vatsim.airportByIcao) return router.push(`/airport/${icao}`)
            const fir =
                vatsim.spy &&
                vatsim.spy.firs &&
                vatsim.spy.firs.find((f) => f.icao == icao || (f.callsignPrefix && controller.callsign.startsWith(f.callsignPrefix)))
            if (fir) return router.push(`/fir/${fir.icao}`)
            if (query == `${controller.cid}` || query == controller.callsign) return router.push(`/member/${controller.cid}`)

        }
    }
    if (query.endsWith("_APP")) return router.push(`/tracon/${query.replace("_APP", "")}`)
    errorMessages.value = `${query}: Nothing found`
}
</script>
