<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="country">
            {{ country.name }}
            {{ country.facility }}
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

const country = computed(() => {
    return vatsim.spy.countries.find((c) => c.prefix == id)
})
</script>