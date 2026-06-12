<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useServerStore } from '@/store/serverStore'
import { useMetricsSocket } from '@/composables/useMetricsSocket'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import ServerList from '@/components/ServerList.vue'
import ServerForm from '@/components/ServerForm.vue'
import MetricChart from '@/components/MetricChart.vue'
import type { Server } from '@/types/server'

const store = useServerStore()
const { connected, paused, pause, resume } = useMetricsSocket()

const selectedServerId = ref<string | null>(null)
const showModal = ref(false)
const deleteTargetId = ref<string | null>(null)
const showDeleteConfirm = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/api/servers')
    const data: Server[] = await res.json()
    store.setServers(data)
  } catch (e) {
    console.error('Failed to load servers', e)
  }
})

function selectServer(id: string): void {
  selectedServerId.value = id
  showModal.value = true
}

function closeModal(): void {
  showModal.value = false
  selectedServerId.value = null
}

function confirmDelete(id: string): void {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function handleDelete(): Promise<void> {
  const id = deleteTargetId.value
  if (!id) return
  try {
    await fetch(`/api/servers/${id}`, { method: 'DELETE' })
    store.removeServer(id)
  } catch (e) {
    console.error('Failed to delete server', e)
  } finally {
    deleteTargetId.value = null
    showDeleteConfirm.value = false
  }
}

function cancelDelete(): void {
  deleteTargetId.value = null
  showDeleteConfirm.value = false
}
</script>

<template>
  <div class="app">
    <header class="app__header">
      <h1 class="app__title">Server Metrics</h1>
      <div class="app__controls">
        <button class="app__pause-btn" @click="paused ? resume() : pause()">
          {{ paused ? '▶ Resume' : '⏸ Pause' }}
        </button>
        <ConnectionStatus :connected="connected" />
      </div>
    </header>

    <main class="app__main">
      <aside class="app__sidebar">
        <ServerForm />
      </aside>

      <section class="app__content">
        <ServerList @select="selectServer" @delete="confirmDelete" />
      </section>
    </main>

    <Teleport to="body">
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal__body">
          <button class="modal__close" @click="closeModal">×</button>
          <h2 class="modal__title">
            {{ store.servers[selectedServerId ?? '']?.name ?? 'Server' }}
          </h2>
          <MetricChart
            :metrics="store.serverMetrics(selectedServerId ?? '').value"
          />
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal" @click.self="cancelDelete">
        <div class="modal__body modal__body--small">
          <h2 class="modal__title">Delete server</h2>
          <p class="modal__text">
            Are you sure you want to delete
            <strong>{{ store.servers[deleteTargetId ?? '']?.name ?? 'this server' }}</strong>?
          </p>
          <div class="modal__actions">
            <button class="modal__btn modal__btn--cancel" @click="cancelDelete">Cancel</button>
            <button class="modal__btn modal__btn--danger" @click="handleDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.app {
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

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  &__body {
    background: #fff;
    border-radius: 16px;
    padding: 32px;
    position: relative;
    min-width: 400px;
    max-width: 90vw;

    &--small {
      min-width: 360px;
    }
  }

  &__close {
    position: absolute;
    top: 12px;
    right: 16px;
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;

    &:hover {
      color: #111827;
    }
  }

  &__title {
    margin: 0 0 24px;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  &__text {
    margin: 0 0 24px;
    font-size: 15px;
    color: #374151;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  &__btn {
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #d1d5db;

    &--cancel {
      background: #fff;
      color: #374151;

      &:hover {
        background: #f3f4f6;
      }
    }

    &--danger {
      background: #ef4444;
      color: #fff;
      border-color: #ef4444;

      &:hover {
        background: #dc2626;
      }
    }
  }
}
</style>