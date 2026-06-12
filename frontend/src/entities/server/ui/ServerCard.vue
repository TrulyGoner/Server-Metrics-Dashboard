<script setup lang="ts">
import type { Server, MetricPoint } from '@/entities/server'
import { getMetricStatusColor } from '@/shared/config/metric'

defineProps<{
  server: Server
  metric: MetricPoint | null
  cpuAlert: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <div class="card">
    <button class="card__delete" @click.stop="emit('delete', server.id)">×</button>
    <div class="card__body" @click="emit('select', server.id)">
      <h3 class="card__name">{{ server.name }}</h3>
      <p class="card__ip">{{ server.ip }}</p>
      <span class="card__type">{{ server.type }}</span>

      <div v-if="metric" class="card__metrics">
        <div class="card__metric">
          <span class="card__label">ЦП</span>
          <span class="card__value">
            <span class="card__dot" :style="{ background: getMetricStatusColor(metric.cpu) }"></span>
            {{ metric.cpu }}%
          </span>
        </div>
        <div class="card__metric">
          <span class="card__label">ОЗУ</span>
          <span class="card__value">
            <span class="card__dot" :style="{ background: getMetricStatusColor(metric.memory) }"></span>
            {{ metric.memory }}%
          </span>
        </div>
      </div>

      <div v-else class="card__metrics">
        <span class="card__waiting">Ожидание данных...</span>
      </div>

      <div v-if="cpuAlert" class="card__alert">ЦП > 90%</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &__body {
    padding: 20px;
  }

  &__delete {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: #fee2e2;
    color: #ef4444;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    &:hover {
      background: #ef4444;
      color: #fff;
    }
  }

  &__name {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  &__ip {
    margin: 0 0 8px;
    font-size: 14px;
    color: #6b7280;
    font-family: monospace;
  }

  &__type {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: #f3f4f6;
    color: #374151;
    text-transform: uppercase;
  }

  &__metrics {
    margin-top: 16px;
    display: flex;
    gap: 16px;
  }

  &__metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 12px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    font-family: monospace;
    display: flex;
    align-items: center;
  }

  &__dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 6px;
    flex-shrink: 0;
  }

  &__waiting {
    font-size: 13px;
    color: #9ca3af;
    font-style: italic;
  }

  &__alert {
    margin-top: 12px;
    padding: 6px 12px;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }
}
</style>
