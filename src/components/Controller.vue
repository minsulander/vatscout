<template>
    <v-col cols="12" sm="6" md="4" lg="3" xl="2">
        <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(value)"
            ><span v-if="prefix">{{ value.callsign.replace(`${prefix}__`, "").replace(`${prefix}_`, "") }}</span
            ><span v-else>{{ value.callsign }}</span>
        </v-chip>
        {{ value.frequency }}<br /><router-link :to="`/member/${value.cid}`" class="mr-1">{{ value.name }}</router-link>
        <v-chip density="comfortable" color="grey-lighten-1" style="padding: 5px" class="mr-1">{{ rating(value) }}</v-chip>
        <span class="text-grey">{{ moment.utc(moment().diff(moment(value.logon_time))).format("HHmm") }}</span>
    </v-col>
</template>

<script setup lang="ts">
import { colorForController } from "@/common"
import { useVatsimStore, Controller } from "@/store/vatsim"
import moment from "moment"

const props = defineProps<{ value: Controller; prefix?: string }>()
const vatsim = useVatsimStore()

function rating(controller: Controller) {
    if (!vatsim.data || !vatsim.data.ratings) return undefined
    const rating = vatsim.data.ratings.find((r) => r.id == controller.rating)
    if (rating) return rating.short
}
</script>
