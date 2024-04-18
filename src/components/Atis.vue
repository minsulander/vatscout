<template>
    <v-col cols="12" sm="6" md="4" lg="3" xl="2" style="cursor: pointer; max-height: 65px; overflow: hidden" @click="emit('click', atis)">
        <v-chip variant="flat" elevated label size="small" color="orange-darken-3" class="text-white font-weight-bold mb-1">
            <span v-if="extractAtisCode(atis)">{{ extractAtisCode(atis) }}</span>
            <span v-else class="text-black">{{ atis.atis_code || "/" }}</span>
        </v-chip>
        {{ atis.frequency }} {{ atis.callsign.replace(`${props.prefix}_`, "").replace("_ATIS", "").replace("ATIS", "") }}
        <router-link :to="`/member/${atis.cid}`">{{ atis.name }}</router-link>
        <span class="text-grey ml-1">{{ moment.utc(moment().diff(moment(atis.logon_time))).format("HHmm") }}</span>
        <br />
        <div class="text-caption text-grey">
            {{ atis.text_atis?.join("\n") }}
        </div>
    </v-col>
</template>

<script setup lang="ts">
import { extractAtisCode } from "@/common"
import { Atis, useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import moment from "moment"

const props = defineProps<{ value: Atis; prefix?: string }>()
const emit = defineEmits(["click"])

const atis = computed(() => props.value)
</script>
