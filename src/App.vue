<template>
  <router-view />
</template>

<script lang="ts" setup>
  import { useVatsimStore } from "./store/vatsim"
  const vatsim = useVatsimStore()
  ;(window as any).vatsim = vatsim
</script>
