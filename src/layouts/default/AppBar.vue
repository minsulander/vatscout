<template>
    <v-app-bar>
        <v-row no-gutters align="center">
            <v-col cols="2" sm="1">
                <v-btn icon plain @click="$router.back()" color="grey"><v-icon size="x-large">mdi-chevron-left</v-icon></v-btn>
            </v-col>
            <v-col cols="6" sm="9">
                <Search />
            </v-col>
            <v-col cols="2" sm="1" class="text-right">
                <v-btn icon plain to="/settings" color="grey-darken-3"><v-icon>mdi-cog</v-icon></v-btn>
            </v-col>
            <v-col cols="2" sm="1" class="text-right">
                <v-progress-circular
                    :model-value="progress"
                    :indeterminate="vatsim.refreshing > 0"
                    :color="outdated ? 'red' : vatsim.refreshing > 0 ? 'white' : 'grey'"
                    class="text-caption mr-2"
                    size="45"
                    @click="clickProgress"
                    style="cursor: pointer"
                >
                    <span v-if="vatsim.data.general">{{ moment(vatsim.data.general.update_timestamp).utc().format("HHmm") }}</span>
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
import moment from "moment"
const vatsim = useVatsimStore()

const progress = computed(() => (vatsim.timeUntilRefresh * 100) / constants.refreshInterval)

const outdated = computed(() => {
    if (!vatsim.data || !vatsim.data.general) return true
    return moment(vatsim.data.general.update_timestamp).isBefore(moment().add(-constants.refreshInterval * 2.5, "millisecond"))
})

function clickProgress() {
    vatsim.timeUntilRefresh = 0
}
</script>
