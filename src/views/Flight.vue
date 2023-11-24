<template>
    <v-container>
        <div class="text-h3">{{ id }}</div>
        <div v-if="pilot" class="mt-3">
            <v-row no-gutters>
                <v-col sm="3" class="label">Pilot</v-col>
                <v-col sm="9" class="value">{{ pilot.name }} {{ pilot.cid }} {{ pilot.pilot_rating }} {{ pilot.military_rating }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Position</v-col>
                <v-col sm="9" class="value"
                    >{{ pilot.latitude }} {{ pilot.longitude }} {{ pilot.heading }}° {{ pilot.altitude }} ft
                    {{ pilot.groundspeed }} kts</v-col
                >
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Settings</v-col>
                <v-col sm="9" class="value">{{ pilot.qnh_i_hg.toFixed(2) }} inHg {{ pilot.qnh_mb }} mb {{ pilot.transponder }}</v-col>
            </v-row>
            <v-row no-gutters v-if="transceivers">
                <v-col sm="3" class="label">Radios</v-col>
                <v-col sm="9" class="value">
                    <span v-for="tx in transceivers" :key="tx.id" class="mr-3">
                        {{ (tx.frequency / 1e6).toFixed(3) }}
                    </span>
                </v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Logon time</v-col>
                <v-col sm="9" class="value">{{ moment(pilot.logon_time).format("HH:mm:ss") }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Server</v-col>
                <v-col sm="9" class="value">{{ pilot.server }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Last updated</v-col>
                <v-col sm="9" class="value">{{ moment(pilot.last_updated).format("HH:mm:ss") }}</v-col>
            </v-row>
        </div>
        <div v-if="within" class="mt-3">
            <v-row no-gutters>
                <v-col sm="3" class="label">Within airspace</v-col>
                <v-col sm="9" class="value">
                    <span v-for="boundary in within">
                        {{ boundary.getProperties().id }}
                    </span>
                </v-col>
            </v-row>
        </div>
        <div v-else-if="prefile">
            <v-row no-gutters>
                <v-col sm="3" class="label">Pre-filed by</v-col>
                <v-col sm="9" class="value">{{ prefile.name }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Last updated</v-col>
                <v-col sm="9" class="value">{{ moment(prefile.last_updated).format("HH:mm:ss") }}</v-col>
            </v-row>
        </div>
        <div v-if="flightplan" class="mt-3">
            <v-row no-gutters>
                <v-col sm="3" class="label">Aircraft</v-col>
                <v-col sm="9" class="value">{{ flightplan.aircraft }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Alternate</v-col>
                <v-col sm="9" class="value">{{ flightplan.alternate }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Altitude</v-col>
                <v-col sm="9" class="value">{{ flightplan.altitude }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Arrival</v-col>
                <v-col sm="9" class="value">{{ flightplan.arrival }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Assigned transponder</v-col>
                <v-col sm="9" class="value">{{ flightplan.assigned_transponder }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Cruise TAS</v-col>
                <v-col sm="9" class="value">{{ flightplan.cruise_tas }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Departure</v-col>
                <v-col sm="9" class="value">{{ flightplan.departure }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Deptime</v-col>
                <v-col sm="9" class="value">{{ flightplan.deptime }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Enroute time</v-col>
                <v-col sm="9" class="value">{{ flightplan.enroute_time }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Flight rules</v-col>
                <v-col sm="9" class="value">{{ flightplan.flight_rules }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Fuel time</v-col>
                <v-col sm="9" class="value">{{ flightplan.fuel_time }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Remarks</v-col>
                <v-col sm="9" class="value">{{ flightplan.remarks }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Revision</v-col>
                <v-col sm="9" class="value">{{ flightplan.revision_id }}</v-col>
            </v-row>
            <v-row no-gutters>
                <v-col sm="3" class="label">Route</v-col>
                <v-col sm="9" class="value">{{ flightplan.route }}</v-col>
            </v-row>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from "vue-router"
import { useVatsimStore } from "@/store/vatsim"
import { computed, inject } from "vue"
const moment = inject("moment")
const route = useRoute()
const vatsim = useVatsimStore()

const id = (route.params.id as string).toUpperCase()

const pilot = computed(() => {
    return vatsim.data.pilots && vatsim.data.pilots.find((p) => p.callsign == id)
})
const prefile = computed(() => {
    return vatsim.data.prefiles && vatsim.data.prefiles.find((p) => p.callsign == id)
})
const flightplan = computed(() => {
    if (pilot.value) return pilot.value.flight_plan
    if (prefile.value) return prefile.value.flight_plan
})
const transceivers = computed(() => {
    return vatsim.transceivers[id]
})
const within = computed(() => {
    if (!pilot.value || !pilot.value.longitude || !pilot.value.latitude) return []
    const boundaries = []
    for (const boundary of vatsim.boundaries) {
        if (boundary.getGeometry().intersectsCoordinate([pilot.value.longitude, pilot.value.latitude])) {
            boundaries.push(boundary)
        }
    }
    return boundaries
})
</script>
