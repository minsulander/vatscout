<template>
    <v-container>
        <span class="text-grey">VATSIM Member</span> {{ id }}
        <v-text-field clearable clear-icon="mdi-close" variant="underlined" placeholder="Name" v-model="name" />
        <div v-if="pilot" class="mt-3">
            <span class="text-grey">Connected as pilot</span>
            <router-link :to="`/flight/${pilot.callsign}`">{{ pilot.callsign }}</router-link> <span class="text-grey"> since</span>
            {{ moment(pilot.logon_time).utc().format("YYYY-MM-DD HH:mm") }}
        </div>
        <div v-if="controller" class="mt-3">
            <span class="text-grey">Connected as {{ facility }}</span> {{ controller.callsign }} <span class="text-grey"> since</span>
            {{ moment(controller.logon_time).utc().format("YYYY-MM-DD HH:mm") }}
            <div><span class="text-grey">Rating</span> {{ rating }}</div>
            <div><span class="text-grey">Frequency</span> {{ controller.frequency }}</div>
            <div><span class="text-grey">Server</span> {{ controller.server }}</div>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import { computed, ref, watch } from "vue"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
const route = useRoute()
const id = computed(() => (route.params.id as string).toUpperCase())
const vatsim = useVatsimStore()

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
    const rating = vatsim.data.ratings.find((r) => r.id == controller.value.rating)
    if (rating) return rating.short
    return "?"
})

watch(id, () => {
    savedName.value = ""
})
</script>
