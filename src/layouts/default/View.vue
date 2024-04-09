<template>
    <v-main>
        <router-view />
            <hr color="#313338" class="mt-5" />
            <v-row class="text-caption font-weight-light mx-1 mb-1">
                <v-col cols="6">
                    <router-link class="text-grey-darken-1 pa-1" to="/">
                    &copy; 2024 VATScout project contributors
                    </router-link>
                </v-col>
                <v-col cols="6" class="text-right">
                    <a class="text-grey-darken-1 pa-1" href="https://github.com/minsulander/vatscout"
                        ><v-icon>mdi-github</v-icon> VATScout on GitHub</a
                    >
                </v-col>
            </v-row>
    </v-main>
</template>

<script lang="ts" setup>
//
</script>
