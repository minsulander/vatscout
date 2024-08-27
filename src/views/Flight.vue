<template>
    <v-container fluid class="pt-3">
        <flight-details :id="id" />
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { computed } from "vue"
import FlightDetails from "@/components/FlightDetails.vue"

const route = useRoute()
const id = computed(() => (route.params.id as string).toUpperCase())
</script>
