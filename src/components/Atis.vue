<template>
    <span v-if="props.compact">
        <v-tooltip :text="`${atis.callsign} ${atis.frequency} ${name} ${timeOnline}`" location="bottom">
            <template v-slot:activator="{ props }">
                <v-chip variant="flat" elevated label size="small" color="orange-darken-3"
                    class="text-white font-weight-bold mb-1" v-bind="props" @click.stop="showAtisDialog = true">
                    <span v-if="extractAtisCode(atis)">{{ extractAtisCode(atis) }}</span>
                    <span v-else class="text-black">{{ atis.atis_code || "/" }}</span>
                    <span v-if="extractRunwayInUse(atis)" class="ml-1 text-orange-lighten-3">{{ extractRunwayInUse(atis)
                    }}</span>
                </v-chip>
            </template>
        </v-tooltip>
        <v-dialog v-model="showAtisDialog" width="600">
            <v-card v-if="atis">
                <v-card-text>
                    {{ atis.text_atis?.join("\n") }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </span>
    <v-col v-else cols="12" sm="6" md="4" lg="3" xl="2" class="mt-3"
        style="cursor: pointer; max-height: 65px; overflow: hidden" @click.stop="showAtisDialog = true">
        <v-chip variant="flat" elevated label size="small" color="orange-darken-3" class="text-white font-weight-bold mb-1">
            <span v-if="extractAtisCode(atis)">{{ extractAtisCode(atis) }}</span>
            <span v-else class="text-black">{{ atis.atis_code || "/" }}</span>
            <span v-if="extractRunwayInUse(atis)" class="ml-1 text-orange-lighten-3">{{ extractRunwayInUse(atis) }}</span>
        </v-chip>
        {{ atis.frequency }} {{ atis.callsign.replace(`${props.prefix}_`, "").replace("_ATIS", "").replace("ATIS", "") }}
        <router-link :to="`/member/${atis.cid}`">{{ atis.name }}</router-link>
        <span class="text-grey ml-1">{{ timeOnline }}</span>
        <br />
        <div class="text-caption text-grey mr-1">
            {{ atis.text_atis?.join("\n") }}
        </div>
        <v-dialog v-model="showAtisDialog" width="600">
            <v-card v-if="atis">
                <v-card-text>
                    {{ atis.text_atis?.join("\n") }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-col>
</template>

<script setup lang="ts">
import { extractAtisCode, extractRunwayInUse } from "@/common"
import { Atis } from "@/store/vatsim"
import { computed, ref } from "vue"
import moment from "moment"

const props = defineProps<{ value: Atis; prefix?: string; compact?: boolean }>()
const atis = computed(() => props.value)

const showAtisDialog = ref(false)

const name = computed(() => {
    if (atis.value) {
        const key = `name_cid_${atis.value.cid}`
        if (key in localStorage) return localStorage[key]
        return atis.value.name
    }
    return ""
})

const timeOnline = computed(() => moment.utc(moment().diff(moment(props.value.logon_time))).format("HHmm"))
</script>
