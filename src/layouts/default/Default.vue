<template>
  <v-app>
    <default-bar v-if="$route.path.length > 1"/>

    <default-view />
  </v-app>
</template>

<script lang="ts" setup>
  import DefaultBar from './AppBar.vue'
  import DefaultView from './View.vue'
</script>
