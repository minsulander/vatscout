<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="fir">
            {{ fir.name }} |
            {{ fir.callsignPrefix }} |
            {{ fir.firBoundary }}
        </div>
        <airport-top-list :fir="id" />
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import constants from "@/constants";
import AirportTopList from "@/components/AirportTopList.vue"
const route = useRoute()
const vatsim = useVatsimStore()

const id = (route.params.id as string).toUpperCase()

const fir = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.find((f) => f.icao == id)
})
</script>