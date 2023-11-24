<template>
    find {{id}}
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { inject, watch } from "vue"
const moment = inject("moment")
const route = useRoute()
const router = useRouter()
const vatsim = useVatsimStore()

const id = (route.params.id as string).toUpperCase()

function stuffChanged() {
    if (vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find(p => p.callsign == id)) {
        router.push(`/flight/${id}`)
    } else if (vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.find(a => a.icao == id)) {
        router.push(`/airport/${id}`)
    } else if (vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find(f => f.icao == id)) {
        router.push(`/fir/${id}`)
    } else if (vatsim.spy && vatsim.spy.uirs && vatsim.spy.uirs.find(u => u.id == id)) {
        router.push(`/uir/${id}`)
    } else if (vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find(c => c.prefix == id)) {
        router.push(`/country/${id}`)
    }
}

watch(() => vatsim.data, stuffChanged)
watch(() => vatsim.spy, stuffChanged)

</script>