<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore, MetricChart } from '@/entities/server'
import ModalWrapper from '@/shared/ui/ModalWrapper.vue'

const props = defineProps<{
  serverId: string | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useServerStore()

const serverName = computed(() => {
  if (!props.serverId) return 'Сервер'
  return store.servers[props.serverId]?.name ?? 'Сервер'
})
</script>

<template>
  <ModalWrapper
    :visible="visible"
    @close="emit('close')"
  >
    <button
      class="modal__close"
      @click="emit('close')"
    >
      ×
    </button>
    <h2 class="modal__title">
      {{ serverName }}
    </h2>
    <MetricChart
      v-if="serverId"
      :metrics="store.metricsHistory.get(serverId) ?? []"
    />
  </ModalWrapper>
</template>

<style scoped lang="scss">
.modal__close {
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

.modal__title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}
</style>
