<template>
    <v-container>
        <span class="text-grey">VATSIM Member</span> {{ id }}
        <v-text-field clearable clear-icon="mdi-close" variant="underlined" placeholder="Name" v-model="name" />
        <div v-if="pilot" class="mt-3">
            <span class="text-grey">Connected as pilot </span>
            <router-link :to="`/flight/${pilot.callsign}`">{{ pilot.callsign }}</router-link> <span class="text-grey"> since</span>
            {{ moment(pilot.logon_time).utc().format("YYYY-MM-DD HH:mm") }}
            <div v-if="pilotRating"><span class="text-grey">Rating</span> {{ pilotRating }}</div>
            <div v-if="militaryRating"><span class="text-grey">Military rating</span> {{ militaryRating }}</div>
        </div>
        <div v-if="controller" class="mt-3">
            <span class="text-grey">Connected as {{ facility }}</span> {{ controller.callsign }} <span class="text-grey"> since</span>
            {{ moment(controller.logon_time).utc().format("YYYY-MM-DD HH:mm") }}
            <div><span class="text-grey">Rating</span> {{ rating }}</div>
            <div><span class="text-grey">Frequency</span> {{ controller.frequency }}</div>
            <div><span class="text-grey">Server</span> {{ controller.server }}</div>
        </div>
        <div class="mt-3">
            <div v-if="stats && stats.pilot > 1">{{ Math.round(stats.pilot) }}<span class="text-grey"> hours as pilot</span></div>
            <div v-if="stats && stats.atc > 1">{{ Math.round(stats.atc) }}<span class="text-grey"> hours as ATC</span></div>
        </div>
        <div class="mt-3">
            <a :href="'https://stats.vatsim.net/stats/' + id" target="_blank" class="text-grey text-caption">VATSIM Statistics Center</a>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, useRoute } from "vue-router"
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { useVatsimStore, apiBaseUrl } from "@/store/vatsim"
import moment from "moment"
import axios from "axios"

const route = useRoute()
const id = computed(() => (route.params.id as string)?.toUpperCase())
const vatsim = useVatsimStore()

const member = reactive({} as any)
const stats = reactive({} as any)

const name = computed({
    get() {
        if (savedName.value) return savedName.value
        const key = `name_cid_${id.value}`
        if (key in localStorage) return localStorage[key]
        if (!vatsim.data || !vatsim.data.controllers || !vatsim.data.pilots) return undefined
        const controller = vatsim.data.controllers.find((c) => c.cid == parseInt(id.value))
        if (controller && controller.name != id.value) return controller.name
        const pilot = vatsim.data.pilots.find((p) => p.cid == parseInt(id.value))
        if (pilot && pilot.name != id.value) return pilot.name
        return ""
    },
    set(value: string) {
        savedName.value = value
        const key = `name_cid_${id.value}`
        if (value) localStorage[key] = value
        else if (key in localStorage) delete localStorage[key]
    },
})

const savedName = ref("")

const pilot = computed(() => vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find((p) => p.cid == parseInt(id.value)))
const controller = computed(
    () => vatsim.data && vatsim.data.controllers && vatsim.data.controllers.find((c) => c.cid == parseInt(id.value))
)

const facility = computed(() => {
    if (!vatsim.data || !vatsim.data.ratings) return undefined
    if (!controller.value) return "?"
    if (!(controller.value.facility in vatsim.data.facilities)) return controller.value.facility
    return vatsim.data.facilities[controller.value.facility].long.toLowerCase()
})

const rating = computed(() => {
    if (!vatsim.data || !vatsim.data.ratings) return undefined
    if (!controller.value) return "?"
    const rating = vatsim.data.ratings.find((r) => controller.value && r.id == controller.value.rating)
    if (rating) return rating.short
    return "?"
})

const pilotRating = computed(() => {
    if (!pilot.value) return undefined
    if (!pilot.value.pilot_rating) return undefined
    const rating = vatsim.data.pilot_ratings.find((r) => r.id == (pilot.value && pilot.value.pilot_rating))
    if (!rating) return undefined
    return rating.short_name
})
const militaryRating = computed(() => {
    if (!pilot.value) return undefined
    if (!pilot.value.military_rating) return undefined
    const rating = vatsim.data.military_ratings.find((r) => r.id == (pilot.value && pilot.value.military_rating))
    if (!rating) return undefined
    return rating.short_name
})

const mounted = ref(false)

watch(id, () => {
    savedName.value = ""
    for (const key in member) delete member[key]
    for (const key in stats) delete stats[key]
    if (id.value && mounted.value) {
        fetchMember()
        fetchStats()
    }
})

onMounted(() => {
    mounted.value = true
    if (id.value) {
        fetchMember()
        fetchStats()
    }
})

onBeforeRouteLeave(() => {
    mounted.value = false
    for (const key in member) delete member[key]
    for (const key in stats) delete stats[key]
})

async function fetchMember() {
    const response = await axios.get(`${apiBaseUrl}/members/${id.value}`)
    Object.assign(member, response.data)
}

async function fetchStats() {
    const response = await axios.get(`${apiBaseUrl}/members/${id.value}/stats`)
    Object.assign(stats, response.data)
}
</script>
