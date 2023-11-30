<template>
    <v-row no-gutters>
        <v-col cols="6" md="3">
        <v-chip
            variant="flat"
            elevated
            label
            size="small"
            class="font-weight-bold mb-1"
            :color="colorForControllerCallsign(value.callsign)"
            >{{ labelForControllerCallsign(value.callsign) }}
        </v-chip>
        {{ value.callsign }}
        </v-col>
        <v-col cols="6" md="4">
            {{ value.cid }}
        </v-col>
        <v-col cols="12" md="5" class="text-right">
            {{ moment(value.start).utcOffset(0).format("YYYY-MM-DD HHmm") }} - {{ moment(value.end).utcOffset(0).format("HHmm") }}
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { colorForControllerCallsign, labelForControllerCallsign } from "@/common"
import { Booking } from "@/store/vatsim"
import moment from "moment"
const props = defineProps<{ value: Booking }>()
</script>
