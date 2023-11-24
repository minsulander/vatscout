<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="fir">
            {{ fir.name }} |
            {{ fir.callsignPrefix }} |
            {{ fir.firBoundary }}
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
const moment = inject("moment")
const route = useRoute()
const vatsim = useVatsimStore()

const id = (route.params.id as string).toUpperCase()

const fir = computed(() => {
    return vatsim.spy.firs.find((f) => f.icao == id)
})

</script>