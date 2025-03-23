<template>
    <span v-if="props.compact && label">
        <v-tooltip :text="metar" location="bottom">
            <template v-slot:activator="{ props }">
                <v-chip
                    variant="flat"
                    elevated
                    label
                    size="small"
                    color="grey-darken-2"
                    class="text-white font-weight-bold mb-1"
                    v-bind="props"
                    @click.stop="showMetarDialog = true"
                >
                    <span>{{ label }}</span>
                </v-chip>
            </template>
        </v-tooltip>
        <v-dialog v-model="showMetarDialog" width="600">
            <v-card v-if="metar">
                <v-card-text>
                    {{ metar }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </span>
    <v-col
        v-else-if="label"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        xl="2"
        class="mt-3"
        style="cursor: pointer; max-height: 65px; overflow: hidden"
        @click.stop="showMetarDialog = true"
    >
        <v-chip variant="flat" elevated label size="small" color="grey-darken-2" class="text-white font-weight-bold mb-1" v-bind="props">
            METAR
        </v-chip>
        {{ label }}
        <br />
        <div class="text-caption text-grey mr-1">
            {{ content }}
        </div>
        <v-dialog v-model="showMetarDialog" width="600">
            <v-card v-if="metar">
                <v-card-text>
                    {{ metar }}
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-col>
</template>

<script setup lang="ts">
import { useMetarStore } from "@/store/metar"
import { computed, onMounted, onUnmounted, ref, watch } from "vue"

const props = defineProps<{ icao: string; compact?: boolean }>()

const metars = useMetarStore()

const metar = computed(() => metars.metar[props.icao])

const label = computed(() => {
    const parsed = metars.parse(props.icao)
    if (!parsed) return ""
    if (!parsed.wind) return ""
    const wind = `${parsed.wind.degrees || 'VRB'}`.padStart(3, "0")
    const speed = `${parsed.wind.speed}` + (parsed.wind.gust ? `G${parsed.wind.gust}` : "")
    return `${wind} ${speed}`
})

const content = computed(() => {
    let content = metar.value
    if (content.startsWith(props.icao)) content = content.substring(props.icao.length).trim()
    return content
})

const showMetarDialog = ref(false)

let metarSubscription: any = undefined
onMounted(() => {
    metarSubscription = metars.subscribe(props.icao)
})
onUnmounted(() => {
    metars.unsubscribe(metarSubscription)
})
watch(
    () => props.icao,
    () => {
        if (metarSubscription) metars.unsubscribe(metarSubscription)
        metarSubscription = metars.subscribe(props.icao)
    }
)
</script>
