<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="country">
            {{ country.name }}
            {{ country.facility }}
        </div>
        <!--
        <div v-if="firs">
            <span v-for="fir in firs" :key="fir.icao" class="mr-3"><router-link :to="`/fir/${fir.icao}`">{{ fir.icao }}</router-link></span>
        </div>
        -->
        <airport-top-list v-if="firs" :firs="firs.map(f => f.icao)" />
     </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import AirportTopList from "@/components/AirportTopList.vue"
const route = useRoute()
const vatsim = useVatsimStore()

const id = (route.params.id as string).toUpperCase()

const country = computed(() => {
    return vatsim.spy && vatsim.spy.countries && vatsim.spy.countries.find((c) => c.prefix == id)
})

const firs = computed(() => {
    return vatsim.spy && vatsim.spy.firs && vatsim.spy.firs.filter(f => f.icao.startsWith(id))
})

</script>