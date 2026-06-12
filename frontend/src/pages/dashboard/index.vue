<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useServerStore } from '@/entities/server'
import { useMetricsSocket } from '@/shared/hooks/useMetricsSocket'
import ConnectionStatus from '@/shared/ui/ConnectionStatus.vue'
import { ServerList } from '@/entities/server'
import { ServerForm } from '@/features/add-server'
import { ServerDetailModal } from '@/features/server-detail'
import { ConfirmDeleteModal } from '@/features/delete-server'
import { fetchServers } from '@/shared/api'

const store = useServerStore()
const { connected, paused, pause, resume } = useMetricsSocket()

const selectedServerId = ref<string | null>(null)
const detailVisible = ref(false)
const confirmModalRef = ref<InstanceType<typeof ConfirmDeleteModal> | null>(null)

onMounted(async () => {
  try {
    store.setServers(await fetchServers())
  } catch (e) {
    console.error('Failed to load servers', e)
  }
})

function selectServer(id: string): void {
  selectedServerId.value = id
  detailVisible.value = true
}

function closeDetail(): void {
  detailVisible.value = false
  selectedServerId.value = null
}

function confirmDelete(id: string): void {
  confirmModalRef.value?.open(id)
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">Server Metrics</h1>
      <div class="dashboard__controls">
        <button class="dashboard__pause-btn" @click="paused ? resume() : pause()">
          {{ paused ? '▶ Возобновить' : '⏸ Пауза' }}
        </button>
        <ConnectionStatus :connected="connected" />
      </div>
    </header>

    <main class="dashboard__main">
      <aside class="dashboard__sidebar">
        <ServerForm />
      </aside>

      <section class="dashboard__content">
        <ServerList @select="selectServer" @delete="confirmDelete" />
      </section>
    </main>

    <ServerDetailModal
      :server-id="selectedServerId"
      :visible="detailVisible"
      @close="closeDetail"
    />

    <ConfirmDeleteModal ref="confirmModalRef" />
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  min-height: 100vh;
  background: #f9fafb;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  &__main {
    display: flex;
    gap: 24px;
    padding: 24px 32px;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__pause-btn {
    padding: 6px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f3f4f6;
    }
  }

  &__sidebar {
    width: 320px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
  }
}
</style>
