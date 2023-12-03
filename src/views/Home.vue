<template>
    <div>
        <v-container>
          <div class="mt-5 text-h3 font-weight-thin text-grey-darken-1">
            Welcome to VATScout!
            <p class="text-body-1 font-weight-light">
              Kinda like VATSpy but not really.
            </p>
          </div>
          <div class="mt-5">
            <span v-if="vatsim.data.general">{{ vatsim.data.pilots.length }}</span>
            <span class="text-grey"> pilots, </span>
            <span v-if="vatsim.data.general"> {{ vatsim.data.controllers.length }}</span>
            <span class="text-grey"> controllers online</span>
          </div>
            <Search class="mt-5" variant="filled" placeholder="Search country, FIR, airport, flight..."/>
        </v-container>
    </div>
</template>

<script lang="ts" setup>
import Search from "@/components/Search.vue"
import { useVatsimStore } from "@/store/vatsim"
const vatsim = useVatsimStore()
</script>
