<template>
    <v-app-bar>
        <v-app-bar-title>
            <v-icon icon="mdi-circle-slice-6" />
        </v-app-bar-title>
        <v-row>
            <v-col sm="10">
                <Search />
            </v-col>
        </v-row>
    </v-app-bar>
</template>

<script lang="ts" setup>
import Search from "@/components/Search.vue"
</script>
