<template>
    <v-app-bar>
        <v-app-bar-title>
            <v-icon icon="mdi-circle-slice-6" />
        </v-app-bar-title>
        <v-row>
            <v-col sm="10">
                <v-text-field variant="underlined" placeholder="Search" v-model="search" autofocus @keyup.enter="enter" />
            </v-col>
        </v-row>
    </v-app-bar>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
const router = useRouter()
const search = ref("")

function enter() {
    router.push(`/${search.value}`)
    search.value = ""
    // TODO handle not found
}
</script>
