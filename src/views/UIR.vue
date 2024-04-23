<template>
    <div class="pa-2" style="max-width: 99%; margin-left: auto; margin-right: auto">
        <div class="text-h4">{{ id }}</div>
        <div v-if="uir">
            {{ uir.name }} |
            <span class="text-grey">{{ uir.firBoundaries.join(', ') }}</span>
        </div>
        <div class="text-h5 font-weight-light text-grey mt-5">
            UIR page is not implemented yet...
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"

const route = useRoute()
const vatsim = useVatsimStore()

const id = computed(() => (route.params.id as string).toUpperCase())

const uir = computed(() => {
    return vatsim.spy && vatsim.spy.uirs && vatsim.spy.uirs.find((u) => u.id == id.value)
})

</script>
