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
                <span v-if="vatsim.data.general">{{ vatsim.data.pilots.length }}</span>
                <span class="text-grey"> pilots, </span>
                <span v-if="vatsim.data.general"> {{ vatsim.data.controllers.length }}</span>
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
import Search from "@/components/Search.vue"
import { useVatsimStore } from "@/store/vatsim"
const vatsim = useVatsimStore()
</script>
