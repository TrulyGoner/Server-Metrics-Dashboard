<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ServerCreate } from '@/entities/server'
import { useServerStore } from '@/entities/server'
import { createServer } from '@/shared/api'
import { validateIp } from '@/shared/lib/validation'

const store = useServerStore()

const form = reactive<ServerCreate>({
  name: '',
  ip: '',
  type: 'physical',
})

const errors = reactive<Record<string, string>>({
  name: '',
  ip: '',
})

const submitting = ref(false)

function validate(): boolean {
  let valid = true
  errors.name = ''
  errors.ip = ''

  if (form.name.length < 2 || form.name.length > 30) {
    errors.name = 'Имя должно содержать от 2 до 30 символов'
    valid = false
  }

  if (!validateIp(form.ip)) {
    errors.ip = 'Неверный IPv4 адрес'
    valid = false
  }

  return valid
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return
  submitting.value = true
  try {
    const server = await createServer(form)
    store.addServer(server)
    form.name = ''
    form.ip = ''
    form.type = 'physical'
  } catch (e) {
    console.error('Failed to create server', e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="form" @submit.prevent="handleSubmit">
    <h2 class="form__title">Добавить сервер</h2>

    <label class="form__field">
      <span class="form__label">Имя</span>
      <input
        v-model="form.name"
        class="form__input"
        :class="{ 'form__input--error': errors.name }"
        placeholder="my-server"
        maxlength="30"
      />
      <span v-if="errors.name" class="form__error">{{ errors.name }}</span>
    </label>

    <label class="form__field">
      <span class="form__label">IP-адрес</span>
      <input
        v-model="form.ip"
        class="form__input"
        :class="{ 'form__input--error': errors.ip }"
        placeholder="192.168.1.100"
      />
      <span v-if="errors.ip" class="form__error">{{ errors.ip }}</span>
    </label>

    <label class="form__field">
      <span class="form__label">Тип</span>
      <select v-model="form.type" class="form__input">
        <option value="physical">Physical</option>
        <option value="virtual">Virtual</option>
        <option value="container">Container</option>
      </select>
    </label>

    <button type="submit" class="form__btn" :disabled="submitting">
      {{ submitting ? 'Создание...' : 'Добавить сервер' }}
    </button>
  </form>
</template>

<style scoped lang="scss">
.form {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  &__input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    &--error {
      border-color: #ef4444;
    }
  }

  &__error {
    font-size: 12px;
    color: #ef4444;
  }

  &__btn {
    padding: 10px 20px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover:not(:disabled) {
      background: #4f46e5;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
