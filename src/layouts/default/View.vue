<template>
    <v-main>
        <router-view />
            <hr color="#222" class="mt-5" />
            <v-row class="text-caption font-weight-light mx-1 mb-1">
                <v-col cols="6">
                    <a class="text-grey-darken-3" href="/">
                    &copy; 2023 VATScout project contributors
                </a>
                </v-col>
                <v-col cols="6" class="text-right">
                    <a class="text-grey-darken-3" href="https://github.com/minsulander/vatscout"
                        ><v-icon>mdi-github</v-icon> VATScout on GitHub</a
                    >
                </v-col>
            </v-row>
    </v-main>
</template>

<script lang="ts" setup>
//
</script>
