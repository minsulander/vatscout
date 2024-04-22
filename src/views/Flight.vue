<template>
    <div class="pa-2">
        <flight-details :id="id" />
    </div>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { computed } from "vue"
import FlightDetails from "@/components/FlightDetails.vue"

const route = useRoute()
const id = computed(() => (route.params.id as string).toUpperCase())
</script>
