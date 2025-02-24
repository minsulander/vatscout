<template>
    <div v-for="airport in activeAirports" :key="airport.icao" class="mt-5">
        <v-row no-gutters @click="emit('clickAirport', airport.icao)" style="cursor: pointer; background: #313338">
            <v-col cols="2" sm="1">
                <div class="text-h6 pl-1">{{ airport.icao }}</div>
            </v-col>
            <v-col cols="10" sm="11">
                <div class="float-right text-right pt-1 px-1">
                    <span v-if="vatsim.movements[airport.icao].prefiledDepartures > 0" class="text-grey ml-3">{{
                        vatsim.movements[airport.icao].prefiledDepartures
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].nofp > 0" class="text-grey-lighten-1 ml-3">{{
                        vatsim.movements[airport.icao].nofp
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].invalidfp > 0" class="text-error ml-3">{{
                        vatsim.movements[airport.icao].invalidfp
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].departing > 0" class="text-cyan-lighten-2 ml-3">{{
                        vatsim.movements[airport.icao].departing
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].departed > 0" class="text-cyan-darken-3 ml-3">{{
                        vatsim.movements[airport.icao].departed
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].prefiledArrivals > 0" class="text-grey ml-3">{{
                        vatsim.movements[airport.icao].prefiledArrivals
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].arriving > 0" class="text-yellow-lighten-2 ml-3">{{
                        vatsim.movements[airport.icao].arriving
                    }}</span>
                    <span v-if="vatsim.movements[airport.icao].arrived > 0" class="text-brown-lighten-1 ml-3">{{
                        vatsim.movements[airport.icao].arrived
                    }}</span>
                    <span class="ml-2">
                        <Metar v-if="vatsim.getAtises(airport.icao).length == 0" compact :icao="airport.icao" class="ml-1" />
                        <Atis
                            compact
                            v-for="atis in vatsim.getAtises(airport.icao)"
                            :key="atis.callsign"
                            :value="atis"
                            class="ml-1"
                            @click="emit('clickAtis', atis)"
                        />
                        <Controller
                            compact
                            v-for="controller in vatsim.getLocalControllers(airport.icao, noAppDep)"
                            :key="controller.callsign"
                            :value="controller"
                            class="ml-1"
                        />
                    </span>
                </div>
                <div class="font-weight-light text-grey-lighten-1 text-truncate pa-1" style="direction: rtl">
                    {{ airport.name }}
                </div>
            </v-col>
        </v-row>
        <v-row no-gutters class="mt-2">
            <v-col cols="12" sm="6">
                <departure-list compact :icao="airport.icao" @click="(f) => emit('clickFlight', f)" />
            </v-col>
            <v-col cols="12" sm="6">
                <arrival-list compact :icao="airport.icao" @click="(f) => emit('clickFlight', f)" />
            </v-col>
        </v-row>
    </div>
    <div class="text-grey-darken-1 text-body-2 mt-5" v-if="!hideInactive && inactiveAirportIds && inactiveAirportIds.length > 0">
        <div class="text-caption text-grey-darken-2">Inactive airports</div>
        <span v-for="id in inactiveAirportIds" :key="id"
            ><router-link :to="`/airport/${id}`" class="text-grey-darken-1">{{ id }}</router-link
            >&nbsp;
        </span>
    </div>
</template>

<script setup lang="ts">
import ArrivalList from "@/components/ArrivalList.vue"
import Metar from "@/components/Metar.vue"
import Atis from "@/components/Atis.vue"
import Controller from "@/components/Controller.vue"
import DepartureList from "@/components/DepartureList.vue"

import { useSettingsStore } from "@/store/settings"
import { useVatsimStore } from "@/store/vatsim"
import { computed } from "vue"
import { compareCallsigns } from "@/common"

const props = defineProps<{ icaos: string[]; hideInactive?: boolean; noAppDep?: boolean }>()
const emit = defineEmits(["clickAirport", "clickFlight", "clickAtis"])

const vatsim = useVatsimStore()
const settings = useSettingsStore()

const airports = computed(
    () => vatsim.spy && vatsim.spy.airports && vatsim.spy.airports.filter((a) => !a.pseudo && a.icao && props.icaos.includes(a.icao))
)

const activeAirports = computed(
    () =>
        airports.value &&
        airports.value
            .filter((a) => {
                if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
                if (vatsim.movements[a.icao].total > 0) return true
                if (vatsim.data.controllers && vatsim.data.controllers.find((c) => vatsim.isMatchingAirportCallsign(c.callsign, a.icao, props.noAppDep)))
                    return true
                if (vatsim.data.atis && vatsim.data.atis.find((c) => vatsim.isMatchingAirportCallsign(c.callsign, a.icao, props.noAppDep))) return true
            })
            .sort((a, b) => {
                if (!(a.icao in vatsim.movements)) vatsim.movements[a.icao] = vatsim.countMovements(a.icao)
                if (!(b.icao in vatsim.movements)) vatsim.movements[b.icao] = vatsim.countMovements(b.icao)
                const acount = vatsim.movements[a.icao].total
                const bcount = vatsim.movements[b.icao].total
                if (acount == bcount) return a.icao.localeCompare(b.icao)
                return acount >= bcount ? -1 : 1
            })
)

const inactiveAirportIds = computed(
    () => airports.value && airports.value.map((a) => a.icao).filter((icao) => !activeAirports.value.find((a) => a.icao == icao))
)

</script>
