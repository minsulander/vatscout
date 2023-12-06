<template>
    <v-row no-gutters>
        <v-col cols="3" md="3">
            <v-chip
                variant="flat"
                elevated
                label
                size="small"
                class="font-weight-bold mb-1 mr-1"
                :color="colorForControllerCallsign(value.callsign)"
            >
                <span v-if="prefix">
                    {{ value.callsign.replace(`${prefix}_`, "") }}
                </span>
                <span v-else>
                    {{ value.callsign }}
                </span>
            </v-chip>
        </v-col>
        <v-col cols="5" md="5">
            <router-link :to="`/member/${value.cid}`" class="text-grey">{{ name }}</router-link>
        </v-col>
        <v-col cols="4" md="4" class="text-right">
            <v-chip variant="flat" size="x-small" label color="red-darken-2" class="mr-2" v-if="value.type == 'exam'">Exam</v-chip>
            <v-chip variant="flat" size="x-small" label color="green-darken-2" class="mr-2" v-else-if="value.type == 'event'">Event</v-chip>
            <v-chip variant="flat" size="x-small" label color="blue-darken-2" class="mr-2" v-else-if="value.type == 'training'"
                >Training</v-chip
            >
            <span v-else-if="value.type && value.type != 'booking'" class="mr-2">{{ value.type }}</span>
            <span v-if="abs(moment().diff(moment(value.start), 'hour')) > 12">
                {{ moment(value.start).utc().format("YYYY-MM-DD HHmm") }} - {{ moment(value.end).utc().format("HHmm") }}
            </span>
            <span v-else>
                {{ moment(value.start).utc().format("HHmm") }} - {{ moment(value.end).utc().format("HHmm") }}
            </span>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { colorForControllerCallsign, labelForControllerCallsign } from "@/common"
import { Booking, useVatsimStore } from "@/store/vatsim"
import moment from "moment"
import { computed } from "vue"
const props = defineProps<{ value: Booking; prefix?: string }>()
const vatsim = useVatsimStore()

const name = computed(() => {
    const key = `name_cid_${props.value.cid}`
    if (key in localStorage) return localStorage[key]
    if (!vatsim.data || !vatsim.data.controllers || !vatsim.data.pilots) return undefined
    const controller = vatsim.data.controllers.find((c) => c.cid == props.value.cid)
    if (controller) return controller.name
    const pilot = vatsim.data.pilots.find((p) => p.cid == props.value.cid)
    if (pilot) return pilot.name
    return props.value.cid
})

const abs = Math.abs
</script>
