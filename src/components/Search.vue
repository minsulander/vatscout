<template>
    <v-text-field variant="underlined" placeholder="Search" ref="siracha" v-model="search" autofocus @keyup.enter="enter" />
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
const router = useRouter()
const search = ref("")
const vatsim = useVatsimStore()

function enter() {
    const query = search.value.toUpperCase()
    search.value = ""
    // Exact matches
    if (vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find((p) => p.callsign == query)) return router.push(`/flight/${query}`)
    if (vatsim.data && vatsim.data.prefiles && vatsim.data.prefiles.find((p) => p.callsign == query)) return router.push(`/flight/${query}`)
    if (query in vatsim.airportByIcao) return router.push(`/airport/${query}`)
    if (vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == query)) return router.push(`/fir/${query}`)
    if (vatsim.spy && vatsim.spy.uirs && vatsim.spy.uirs.find((u) => u.id == query)) return router.push(`/uir/${query}`)
    if (vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find((c) => c.prefix == query)) return router.push(`/country/${query}`)
    // Partial matches
    const shortPilot = query.length == 3 && vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find((p) => `${p.callsign.substring(0, 1)}${p.callsign.substring(3)}` == query)
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
    // TODO handle
    console.log(`Search ${query}: Nothing found`)
}
</script>
