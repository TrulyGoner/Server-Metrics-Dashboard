<script setup lang="ts">
import { ref } from 'vue'
import { useServerStore } from '@/entities/server'
import { deleteServer } from '@/shared/api'
import ModalWrapper from '@/shared/ui/ModalWrapper.vue'

const store = useServerStore()
const isOpen = ref(false)
const targetId = ref<string | null>(null)
const isDeleting = ref(false)
const serverName = ref('')

function open(id: string): void {
  targetId.value = id
  serverName.value = store.servers[id]?.name ?? 'этот сервер'
  isOpen.value = true
}

function close(): void {
  if (!isDeleting.value) {
    isOpen.value = false
    targetId.value = null
  }
}

async function handleDelete(): Promise<void> {
  if (!targetId.value) return
  isDeleting.value = true
  try {
    await deleteServer(targetId.value)
    store.removeServer(targetId.value)
    isOpen.value = false
    targetId.value = null
  } catch (e) {
    console.error('Failed to delete server', e)
  } finally {
    isDeleting.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <ModalWrapper
    :visible="isOpen"
    small
    @close="close"
  >
    <h2 class="modal__title">
      Удалить сервер
    </h2>
    <p class="modal__text">
      Вы уверены, что хотите удалить
      <strong>{{ serverName }}</strong>?
    </p>
    <div class="modal__actions">
      <button
        class="modal__btn modal__btn--cancel"
        :disabled="isDeleting"
        @click="close"
      >
        Отмена
      </button>
      <button
        class="modal__btn modal__btn--danger"
        :disabled="isDeleting"
        @click="handleDelete"
      >
        Удалить
      </button>
    </div>
  </ModalWrapper>
</template>

<style scoped lang="scss">
.modal__title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.modal__text {
  margin: 0 0 24px;
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
}

.modal__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal__btn {
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
</style>
