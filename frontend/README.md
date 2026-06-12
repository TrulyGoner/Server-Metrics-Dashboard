# Server Metrics Dashboard — Frontend

Dashboard для мониторинга серверов в реальном времени через WebSocket.

## Стек

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** (strict mode, без `any`)
- **Pinia** (управление состоянием)
- **Vite** (сборка)
- **Chart.js + vue-chartjs** (графики)
- **Vitest** (тесты)

---

## Архитектура: Feature-Sliced Design

```
src/
├── app/                          — точка входа
│   ├── App.vue                   — корневой компонент (7 строк)
│   └── styles/index.css          — глобальные стили
├── pages/dashboard/              — страница-оркестратор
│   └── index.vue                 — композиция фич, layout
├── entities/server/              — бизнес-сущность
│   ├── model/
│   │   ├── store.ts              — Pinia store (нормализованные серверы, метрики, алерты)
│   │   └── types.ts              — Server, MetricPoint, WsEvent
│   └── ui/
│       ├── ServerCard.vue        — карточка с цветовой индикацией
│       ├── ServerList.vue        — грид карточек
│       └── MetricChart.vue       — график CPU/RAM (Chart.js)
├── features/                     — изолированные фичи
│   ├── add-server/ui/ServerForm.vue      — форма с валидацией (name, IPv4, type)
│   ├── delete-server/ui/ConfirmDeleteModal.vue — подтверждение удаления
│   └── server-detail/ui/ServerDetailModal.vue  — модалка с графиком
├── shared/                       — переиспользуемые модули
│   ├── api/servers.ts            — REST-клиент (fetchServers, createServer, deleteServer)
│   ├── config/metric.ts          — константы (пороги, цвета, таймауты)
│   ├── hooks/useMetricsSocket.ts — WebSocket composable (auto-reconnect, pause/resume)
│   ├── lib/validation.ts         — валидатор IPv4
│   └── ui/
│       ├── ModalWrapper.vue      — переиспользуемая Teleport-модалка
│       └── ConnectionStatus.vue  — индикатор WS (зелёный/красный)
└── __tests__/
    └── serverStore.spec.ts       — 6 Vitest-тестов
```

> Каждый модуль FSD имеет barrel-export (`index.ts`) — импорт через алиас `@/`.

---

## Запуск

### Фронтенд (отдельно)

```bash
cd frontend
npm install
npm run dev
```

Открыть `http://localhost:5173`

> Vite проксирует `/api` и `/ws` на `localhost:3001`.

### Бэкенд (отдельно)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 3001
```

Swagger: `http://localhost:3001/docs`

### Через mise (оба сразу)

```bash
mise run dev
```

---

## Тесты

```bash
cd frontend
npm test
```

6 unit-тестов (Vitest):

| Тест | Описание |
|------|----------|
| `adds a metric point` | Сохранение метрики в store |
| `truncates history to 30` | 35 вставок → остаётся 30 |
| `cpuAlert when >90% for >=10s` | 6 метрик подряд >90% → алерт |
| `clears cpuAlert when cpu drops` | Падение CPU → алерт сбрасывается |
| `no alert for short spike` | 4 метрики >90% (<10 сек) → алерт НЕ срабатывает |
| `resets alert on server remove` | Удаление сервера → алерт очищен |

---

## Функционал

| Фича | Описание |
|------|----------|
| **Список серверов** | Карточки с именем, IP, типом, CPU/RAM, цветовой индикатор (< 60% зелёный, 60–85% жёлтый, > 85% красный) |
| **График** | Клик по карточке — модалка с Chart.js (CPU + RAM, последние 30 точек, обновляется в реальном времени) |
| **Форма добавления** | Валидация: name 2–30 символов, IPv4 (октеты 0–255), select type |
| **WebSocket** | Auto-reconnect 3с, статус в UI, удаление сервера через WS |
| **Pause / Resume** | Заморозка обновления метрик (удаление продолжает работать) |
| **CPU Alert** | > 90% дольше 10 секунд → красный бейдж на карточке |
| **Удаление** | Кнопка × → модалка подтверждения → DELETE /api/servers/{id} |
