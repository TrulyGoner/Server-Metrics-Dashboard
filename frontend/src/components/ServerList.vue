<script setup lang="ts">
import { useServerStore } from '@/store/serverStore'
import ServerCard from './ServerCard.vue'

const store = useServerStore()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <div class="grid">
    <ServerCard
      v-for="server in store.serverList"
      :key="server.id"
      :server="server"
      :metric="store.latestMetric(server.id).value"
      :cpu-alert="store.isCpuAlert(server.id).value"
      @select="emit('select', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
</style>