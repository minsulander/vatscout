<template>
    <div>
        <v-container>
            <div class="mt-5 text-h3 font-weight-thin text-grey-darken-1">
                Welcome to VATScout!
                <p class="text-body-1 font-weight-light mt-5">
                    Kinda like VATSpy but not really. Mainly intended for controllers to get a quick look on what's happening on VATSIM.
                </p>
            </div>
            <div class="mt-5" v-if="vatsim.data.general">
                <span>{{ pilotsOnlineCount }}</span>
                <span class="text-grey"> pilots, </span>
                <span> {{ controllersOnlineCount }}</span>
                <span class="text-grey"> controllers online</span>
            </div>
            <div
                v-if="(!vatsim.data.general || !vatsim.data.pilots || !vatsim.spy || !vatsim.spy.airports) && vatsim.refreshing"
                class="mt-5 text-grey"
            >
                Loading VATSIM data...
            </div>
            <Search
                v-if="vatsim.data.pilots && vatsim.spy.airports"
                class="mt-5"
                variant="filled"
                placeholder="Search country, FIR, airport, flight..."
            />
        </v-container>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue"
import Search from "@/components/Search.vue"
import { useVatsimStore } from "@/store/vatsim"
const vatsim = useVatsimStore()

const pilotsOnlineCount = computed(() => vatsim.data.pilots.length)
const controllersOnlineCount = computed(() => vatsim.data.controllers.filter(c => c.facility > 0 && c.callsign && !c.callsign.endsWith("_SUP")).length)
</script>
