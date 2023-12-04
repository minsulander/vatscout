<template>
    <v-container>
        <span class="text-grey">VATSIM Member</span> {{ id }}
        <v-text-field variant="underlined" placeholder="Name" v-model="name" @keydown.enter="nameEnter"/>
        <div v-if="pilot" class="mt-3">
            <span class="text-grey">Connected as pilot</span> <router-link :to="`/flight/${pilot.callsign}`">{{ pilot.callsign }}</router-link>
            <span class="text-grey"> since</span> {{ moment(pilot.logon_time).utc().format("YYYY-MM-DD HH:mm") }}
        </div>
        <div v-if="controller" class="mt-3">
            <span class="text-grey">Connected as controller</span> {{ controller.callsign }}
            <span class="text-grey"> since</span> {{ moment(controller.logon_time).utc().format("YYYY-MM-DD HH:mm") }}
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import { computed } from "vue"
import { useVatsimStore } from "@/store/vatsim"
import moment from "moment"
const route = useRoute()
const id = computed(() => (route.params.id as string).toUpperCase())
const vatsim = useVatsimStore()

const name = computed({
    get() {
        const key = `name_cid_${id.value}`
        if (key in localStorage) return localStorage[key]
        if (!vatsim.data || !vatsim.data.controllers || !vatsim.data.pilots) return undefined
        const controller = vatsim.data.controllers.find((c) => c.cid == parseInt(id.value))
        if (controller && controller.name != id.value) return controller.name
        const pilot = vatsim.data.pilots.find((p) => p.cid == parseInt(id.value))
        if (pilot && pilot.name != id.value) return pilot.name
    },
    set(value: string) {
        const key = `name_cid_${id.value}`
        localStorage[key] = value
    },
})

const pilot = computed(() => vatsim.data && vatsim.data.pilots && vatsim.data.pilots.find(p => p.cid == parseInt(id.value)))
const controller = computed(() => vatsim.data && vatsim.data.controllers && vatsim.data.controllers.find(c => c.cid == parseInt(id.value)))

function nameEnter() {
    if (!name.value) return
    const key = `name_cid_${id.value}`
    localStorage[key] = name.value
}
</script>
