<script setup lang="ts">
defineProps<{
  connected: boolean
}>()
</script>

<template>
  <div :class="['status', { 'status--online': connected, 'status--offline': !connected}]">
    <span class="status__dot" />
    <span>{{ connected ? 'Подключен' : 'Отключен' }}</span>
  </div>
</template>

<style scoped lang="scss">
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;

  &--online {
    background: #dcfce7;
    color: #166534;
    .status__dot {
      background: #22c55e;
    }
  }

  &--offline {
    background: #fee2e2;
    color: #991b1b;
    .status__dot {
      background: #ef4444;
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
}

</style>
