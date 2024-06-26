<template>
    <v-app>
        <v-app-bar color="#2b2d31">
            <v-row no-gutters align="center">
                <v-col cols="2" sm="2">
                    <span v-if="$route.path.length > 1">
                        <v-btn icon plain @click="clickBack" color="grey"><v-icon size="x-large">mdi-chevron-left</v-icon></v-btn>
                    </span>
                </v-col>
                <v-col cols="4" sm="7">
                    <span v-if="$route.path.length > 1">
                        <Search class="app-bar-search" />
                    </span>
                </v-col>
                <v-col cols="6" sm="3" class="text-right">
                    <v-btn icon plain color="grey-darken-2" @click="clickSettings"
                        ><v-icon>mdi-cog</v-icon><v-tooltip activator="parent" location="bottom">Settings</v-tooltip></v-btn
                    >
                    <v-btn icon plain :color="settings.soundOn ? 'grey' : 'grey-darken-2'" @click="clickBell">
                        <v-icon>{{ settings.soundOn ? "mdi-bell-ring" : "mdi-bell-off" }}</v-icon>
                        <v-tooltip activator="parent" location="bottom">Toggle notifications sounds</v-tooltip>
                    </v-btn>
                    <v-btn icon plain class="mx-2" @click="clickProgress">
                        <v-progress-circular
                            :model-value="progress"
                            :indeterminate="vatsim.refreshing > 0"
                            :color="outdated ? 'red' : vatsim.refreshing > 0 ? 'white' : 'grey'"
                            class="text-caption"
                            size="45"
                        >
                            <span v-if="vatsim.data.general">{{ moment(vatsim.data.general.update_timestamp).utc().format("HHmm") }}</span>
                        </v-progress-circular>
                        <v-tooltip activator="parent" location="bottom">Click to reload data</v-tooltip>
                    </v-btn>
                </v-col>
            </v-row>
            <v-snackbar v-model="snackbar" timeout="5000" color="grey-darken-3" class="mb-3">
                <span v-html="snackbarText" />

                <template v-slot:actions>
                    <v-btn icon size="small" @click="snackbar = false"><v-icon>mdi-close</v-icon></v-btn>
                </template>
            </v-snackbar>
            <v-dialog v-model="showSettings" width="90%">
                <v-card>
                    <v-card-text>
                        <Settings />
                    </v-card-text>
                </v-card>
            </v-dialog>
        </v-app-bar>
        <v-main>
            <router-view />
            <hr color="#313338" class="mt-5" />
            <v-row class="text-caption font-weight-light mx-1 mb-1">
                <v-col cols="6">
                    <router-link class="text-grey-darken-1 pa-1" to="/"> &copy; 2024 VATScout project contributors </router-link>
                </v-col>
                <v-col cols="6" class="text-right">
                    <a class="text-grey-darken-1 pa-1" href="https://github.com/minsulander/vatscout"
                        ><v-icon>mdi-github</v-icon> VATScout on GitHub</a
                    >
                </v-col>
            </v-row>
        </v-main>
    </v-app>
</template>

<style scoped>
.v-progress-circular {
    opacity: 0.7;
}
</style>
<style>
.app-bar-search .v-messages__message {
    margin-left: -16px;
    margin-top: -5px;
}
</style>

<script lang="ts" setup>
import Search from "@/components/Search.vue"
import Settings from "@/views/Settings.vue"
import constants from "@/constants"
import { useVatsimStore } from "@/store/vatsim"
import { computed, ref } from "vue"
import { useSettingsStore } from "@/store/settings"
import { useDisplay } from "vuetify"
import moment from "moment"
import { Howl } from "howler"
import router from "@/router"

const vatsim = useVatsimStore()
const settings = useSettingsStore()
;(window as any).vatsim = vatsim
;(window as any).settings = settings

const display = useDisplay()

const showSettings = ref(false)
const snackbar = ref(false)
const snackbarText = ref("")

const progress = computed(() => (vatsim.timeUntilRefresh * 100) / constants.refreshInterval)

const outdated = computed(() => {
    if (!vatsim.data || !vatsim.data.general) return true
    return moment(vatsim.data.general.update_timestamp).isBefore(moment().add(-constants.refreshInterval * 2.5, "millisecond"))
})

const sound = new Howl({ src: "/audio/notification.mp3" })

function clickSettings() {
    if (display.xs.value) {
        router.push("/settings")
    } else {
        showSettings.value = true
    }
}

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

function clickBack() {
    if (!history.state.back) router.replace("/")
    else return router.back()
}
</script>
