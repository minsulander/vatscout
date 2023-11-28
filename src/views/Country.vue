<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="country">
            {{ country.name }}
            {{ country.facility }}
        </div>
        <v-row class="mt-2">
            <v-col sm="3" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ controller.callsign }}
                </v-chip>
                {{ controller.frequency }}<br />{{ controller.name }}
            </v-col>
        </v-row>
        <airport-top-list v-if="firs" :firs="firs.map((f) => f.icao)" class="mt-2" />
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import { colorForController, labelForController } from "@/common"
import AirportTopList from "@/components/AirportTopList.vue"
const route = useRoute()
const vatsim = useVatsimStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const country = computed(() => {
    return vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find((c) => c.prefix == id.value)
})

const firs = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.filter((f) => f.icao.startsWith(id.value))
})

const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    const callsignPrefixes: string[] = []
    if (firs.value) {
        for (const fir of firs.value) {
            if (fir.callsignPrefix) callsignPrefixes.push(fir.callsignPrefix)
        }
    }
    return vatsim.data.controllers.filter(
        (c) =>
            c.callsign &&
            c.callsign.endsWith("_CTR") &&
            (c.callsign.startsWith(id.value) || callsignPrefixes.find((prefix) => c.callsign.startsWith(prefix)))
    )
})
</script>
