<script setup lang="ts">
import { useServerStore } from '@/entities/server'
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
      :metric="store.latestMetrics[server.id] ?? null"
      :cpu-alert="store.cpuAlerts[server.id] ?? false"
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
