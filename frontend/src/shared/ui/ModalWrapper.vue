<script setup lang="ts">
defineProps<{
  visible: boolean
  small?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal" @click.self="emit('close')">
      <div class="modal__body" :class="{ 'modal__body--small': small }">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
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
}
</style>
