<template>
    <v-container>
        <div class="text-h4">{{ id }}</div>
        <div v-if="uir">
            {{ uir.name }} |
            {{ uir.firBoundaries }}
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
import moment from "moment"
const route = useRoute()
const vatsim = useVatsimStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const uir = computed(() => {
    return vatsim.spy.uirs.find((u) => u.id == id.value)
})

</script>
