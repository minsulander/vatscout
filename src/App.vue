<template>
  <router-view />
</template>

<script lang="ts" setup>
  import { useSettingsStore } from "./store/settings";
import { useVatsimStore } from "./store/vatsim"
  const vatsim = useVatsimStore()
  const settings = useSettingsStore()
  ;(window as any).vatsim = vatsim
  ;(window as any).settings = settings
</script>
