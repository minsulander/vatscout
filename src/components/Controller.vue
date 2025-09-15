<template>
    <span v-if="props.compact">
        <v-tooltip :text="`${controller.callsign} ${controller.frequency} ${name} ${timeOnline}`" location="bottom">
            <template v-slot:activator="{ props }">
                <v-chip
                    variant="flat"
                    elevated
                    label
                    size="small"
                    class="font-weight-bold mb-1"
                    style="width: 45px"
                    :style="controller.frequency == '199.998' ? 'opacity: 0.5' : ''"
                    v-bind="props"
                    :color="colorForController(controller)"
                    >{{ labelForController(controller) }}
                </v-chip>
            </template>
        </v-tooltip>
    </span>
    <v-col v-else cols="12" sm="6" md="4" lg="3" xl="2" class="mt-3" :style="controller.frequency == '199.998' ? 'opacity: 0.5' : ''">
        <v-chip variant="flat" elevated label size="small" class="font-weight-bold mb-1" :color="colorForController(value)"
            >{{ callsign }}
        </v-chip>
        <span class="ml-1" v-if="value.frequency != '199.998'"> {{ value.frequency }}</span
        ><br />
        <router-link :to="`/member/${value.cid}`" class="mr-1">{{ name }}</router-link>
        <v-chip density="comfortable" color="grey-lighten-1" style="padding: 5px" class="mr-1">{{ rating(value) }}</v-chip>
        <span class="text-grey">{{ timeOnline }}</span>
    </v-col>
</template>

<script setup lang="ts">
import { colorForController, labelForController } from "@/common"
import { useVatsimStore, Controller } from "@/store/vatsim"
import moment from "moment"
import { computed } from "vue"

const props = defineProps<{ value: Controller; prefix?: string; compact?: boolean }>()
const controller = computed(() => props.value)
const vatsim = useVatsimStore()

const callsign = computed(() => {
    let callsign = props.value.callsign
    if (callsign == "ESSR_MM_APP") return "MM_RTC"
    if (callsign == "ESSR_CTR") return "OS_RTC"
    if (props.prefix) callsign = callsign.replace(`${props.prefix}__`, "").replace(`${props.prefix}_`, "")
    return callsign
})

const name = computed(() => {
    if (controller.value) {
        const key = `name_cid_${controller.value.cid}`
        if (key in localStorage) return localStorage[key]
        return controller.value.name
    }
    return ""
})

const timeOnline = computed(() => moment.utc(moment().diff(moment(props.value.logon_time))).format("HHmm"))

function rating(controller: Controller) {
    if (!vatsim.data || !vatsim.data.ratings) return undefined
    const rating = vatsim.data.ratings.find((r) => r.id == controller.rating)
    if (rating) return rating.short
}
</script>
