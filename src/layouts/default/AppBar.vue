<template>
    <v-app-bar>
        <v-app-bar-title class="text-grey font-weight-light"> VATScout </v-app-bar-title>
        <v-row class="mt-1">
            <v-col sm="10">
                <Search />
            </v-col>
            <v-col sm="1" class="pt-4">
                <v-progress-circular
                    :model-value="progress"
                    :indeterminate="vatsim.refreshing > 0"
                    :color="outdated ? 'red' : vatsim.refreshing > 0 ? 'white' : 'grey'"
                    class="text-caption"
                    size="45"
                    @click="clickProgress"
                    style="cursor: pointer"
                >
                    <span v-if="vatsim.data.general">{{ moment(vatsim.data.general.update_timestamp).utcOffset(0).format("HHmm") }}</span>
                </v-progress-circular>
            </v-col>
        </v-row>
    </v-app-bar>
</template>

<style scoped>
.v-progress-circular {
    opacity: 0.7;
}
</style>

<script lang="ts" setup>
import Search from "@/components/Search.vue"
import constants from "@/constants"
import { useVatsimStore } from "@/store/vatsim"
import { inject } from "vue"
import { computed } from "vue"
const vatsim = useVatsimStore()
const moment = inject("moment")

const progress = computed(() => (vatsim.timeUntilRefresh * 100) / constants.refreshInterval)

const outdated = computed(() => {
    if (!vatsim.data || !vatsim.data.general) return true
    return moment(vatsim.data.general.update_timestamp).isBefore(moment().add(-constants.refreshInterval * 2.5, "millisecond"))
})

function clickProgress() {
    vatsim.timeUntilRefresh = 0
}
</script>
