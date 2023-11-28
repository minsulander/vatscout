<template>
  <div>
    HEJ <span v-if="vatsim.data.general">{{vatsim.data.general.connected_clients}}</span>
  </div>
</template>

<script lang="ts" setup>
  
  import { useVatsimStore } from "@/store/vatsim"
  const vatsim = useVatsimStore()


</script>
