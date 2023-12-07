<template>
    <v-app-bar>
        <v-row no-gutters align="center">
            <v-col cols="2" sm="2">
                <v-btn icon plain @click="$router.back()" color="grey"><v-icon size="x-large">mdi-chevron-left</v-icon></v-btn>
            </v-col>
            <v-col cols="4" sm="7">
                <Search />
            </v-col>
            <v-col cols="6" sm="3" class="text-right">
                <v-btn icon plain to="/settings" color="grey-darken-3"><v-icon>mdi-cog</v-icon></v-btn>
                <v-btn icon plain :color="settings.soundOn ? 'grey-darken-1' : 'grey-darken-3'" @click="clickBell"><v-icon>{{settings.soundOn ? 'mdi-bell-ring' : 'mdi-bell-off'}}</v-icon></v-btn>
                <v-progress-circular
                    :model-value="progress"
                    :indeterminate="vatsim.refreshing > 0"
                    :color="outdated ? 'red' : vatsim.refreshing > 0 ? 'white' : 'grey'"
                    class="text-caption mx-2"
                    size="45"
                    @click="clickProgress"
                    style="cursor: pointer"
                >
                    <span v-if="vatsim.data.general">{{ moment(vatsim.data.general.update_timestamp).utc().format("HHmm") }}</span>
                </v-progress-circular>
            </v-col>
        </v-row>
        <v-snackbar v-model="snackbar" timeout="5000" color="grey-darken-3" class="mb-3">
            <span v-html="snackbarText"/>

            <template v-slot:actions>
                <v-btn icon size="small" @click="snackbar = false"><v-icon>mdi-close</v-icon></v-btn>
            </template>
        </v-snackbar>
    </v-app-bar>
</template>

<style scoped>
.v-progress-circular {
    opacity: 0.7;
}
</style>

<script lang="ts" setup>
import Search from "@/components/Search.vue"
import constants from "@/constants"
import { useVatsimStore } from "@/store/vatsim"
import { computed, ref } from "vue"
import moment from "moment"
import { useSettingsStore } from "@/store/settings"
import { Howl } from "howler"
const vatsim = useVatsimStore()
const settings = useSettingsStore()

const snackbar = ref(false)
const snackbarText = ref("")

const progress = computed(() => (vatsim.timeUntilRefresh * 100) / constants.refreshInterval)

const outdated = computed(() => {
    if (!vatsim.data || !vatsim.data.general) return true
    return moment(vatsim.data.general.update_timestamp).isBefore(moment().add(-constants.refreshInterval * 2.5, "millisecond"))
})

const sound = new Howl({ src: "/audio/notification.mp3" })

function clickBell() {
    settings.soundOn = !settings.soundOn
    settings.save()
    if (settings.soundOn) {
        sound.volume(settings.soundVolume / 100)
        sound.play()
        snackbarText.value = "Notification sounds will be played, e.g. when new flights pop up"
        snackbar.value = true
    } else {
        snackbarText.value = "Notification sounds are muted"
        snackbar.value = true

    }
}

function clickProgress() {
    vatsim.timeUntilRefresh = 0
}
</script>
