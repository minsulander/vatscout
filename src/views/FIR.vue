<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="fir">
            {{ fir.name }}<span v-if="fir.callsignPrefix"> | {{ fir.callsignPrefix }}</span>
        </div>
        <v-row class="mt-2">
            <v-col sm="3" v-for="controller in controllers">
                <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(controller)"
                    >{{ controller.callsign }}
                </v-chip>
                {{ controller.frequency }}<br />{{ controller.name }}
            </v-col>
        </v-row>
        <airport-top-list :fir="id" class="mt-2" />
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

const fir = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == id.value)
})
const controllers = computed(() => {
    if (!vatsim.data.controllers) return []
    return vatsim.data.controllers.filter(
        (c) =>
            c.callsign &&
            (c.callsign.startsWith(`${id.value}_`) ||
                (fir.value && fir.value.callsignPrefix && c.callsign.startsWith(fir.value.callsignPrefix)) ||
                (id.value.startsWith("K") && c.callsign.startsWith(`${id.value.substring(1)}_`)))
    )
})
</script>
