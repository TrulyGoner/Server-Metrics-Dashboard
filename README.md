# Server Metrics Dashboard

Мониторинг серверов в реальном времени: бэкенд генерирует метрики CPU/RAM и передаёт их через WebSocket, фронтенд отображает карточки серверов с цветовой индикацией и графиками.

## Стек

- **Backend:** Python 3.12 + FastAPI + uvicorn
- **Frontend:** Vue 3 (Composition API) + TypeScript + Pinia + Vite + Chart.js / vue-chartjs
- **Тесты:** Vitest

## Структура проекта

```
backend/
  main.py            — FastAPI-приложение: REST API + WebSocket
  requirements.txt   — зависимости Python
frontend/
  src/
    app/             — App.vue + глобальные стили
    pages/           — DashboardPage (страница-оркестратор)
    entities/server/ — бизнес-сущность: store, types, UI (Card, List, Chart)
    features/        — фичи: add-server, delete-server, server-detail
    shared/          — переиспользуемое: API, хук WS, валидация, UI-кит
    __tests__/       — unit-тесты store (6 тестов)
  index.html, vite.config.ts, tsconfig*.json
mise.toml            — конфигурация mise (инструменты + задачи)
```

## Запуск

```bash
# Установить среду (Python 3.12, Node 22)
mise install

# Установить зависимости
mise run install


# Запустить проект:
mise run dev

# Тесты фронтенда
mise run test

# Запустить оба сервера отдельно (бэкенд :3001, фронт :5173)
cd backend   && uvicorn main:app --reload --port 3001
cd frontend  && npx vite
```

## API

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/servers` | Список серверов |
| POST | `/api/servers` | Создать сервер |
| PUT | `/api/servers/{id}` | Обновить имя сервера |
| DELETE | `/api/servers/{id}` | Удалить сервер |
| WS | `/ws` | WebSocket: метрики каждые 2 сек |

## Бэкенд (`backend/main.py`)

### Реализовано

- **`init_db()`** — при старте генерирует 3–5 серверов со случайными именами (`web-42`, `db-7` и т.д.), IP (`10.0.x.x`) и типом (physical/virtual/container)
- **`GET /api/servers`** — возвращает список всех серверов из `db`
- **`POST /api/servers`** — создаёт сервер с валидацией IPv4, длины имени (2–30) и типа через Pydantic
- **`PUT /api/servers/{id}`** — обновляет имя сервера, 404 если не найден
- **`DELETE /api/servers/{id}`** — удаляет сервер, шлёт `server_removed` по WS, 404 если не найден
- **`GET /ws`** — WebSocket: принимает соединения, держит список `active_connections`
- **`broadcast()`** — рассылает сообщение всем подключённым клиентам, чистит мёртвые соединения
- **`metrics_loop()`** — фоновая задача (asyncio): каждые 2 сек генерит случайные CPU (0–95%) и RAM (10–90%) для каждого сервера, шлёт через `broadcast`
- **`lifespan()`** — asynccontextmanager: при старте вызывает `init_db` + запускает `metrics_loop`, при остановке отменяет задачу

## Фронтенд (`frontend/src/`)

Архитектура — **Feature-Sliced Design (FSD)**:

```
src/
  app/                    — точка входа
    App.vue               — корневой компонент (рендерит DashboardPage)
    styles/index.css      — глобальные стили
  pages/dashboard/        — страница-оркестратор
  entities/server/        — бизнес-сущность
    model/store.ts        — Pinia store
    model/types.ts        — Server, MetricPoint, WsEvent
    ui/ServerCard.vue, ServerList.vue, MetricChart.vue
  features/               — изолированные фичи
    add-server/           — ServerForm.vue (валидация, POST)
    delete-server/        — ConfirmDeleteModal.vue (подтверждение, DELETE)
    server-detail/        — ServerDetailModal.vue (модалка с графиком)
  shared/                 — переиспользуемое
    api/servers.ts        — REST-клиент
    config/metric.ts      — константы (пороги, цвета, таймауты)
    hooks/                — useMetricsSocket (WS с auto-reconnect, pause/resume)
    lib/validation.ts     — валидатор IPv4
    ui/ModalWrapper.vue, ConnectionStatus.vue
  __tests__/serverStore.spec.ts — 6 unit-тестов
```

### Store (`entities/server/model/store.ts`)

- **`servers`** — `Record<string, Server>` — нормализованное хранение по id
- **`metricsHistory`** — `Map<string, MetricPoint[]>` — до 30 последних точек на сервер
- **`cpuAlerts`** — `Record<string, boolean>` — флаг алерта CPU > 90% дольше 10 сек
- **`serverList`** / **`latestMetrics`** — computed для шаблона
- **`addMetric()`** — добавляет точку, обрезает до 30, вычисляет CPU-алерт
- **`computeCpuAlert()`** — чистая функция для определения алерта (извлекаема в тесты)
- **`removeServer()`** — удаляет сервер и его метрики с алертами

### WebSocket (`shared/hooks/useMetricsSocket.ts`)

- Подключается к `ws://<host>/ws` при монтировании
- Auto-reconnect через 3 секунды при обрыве
- Pause/Resume — при паузе метрики не записываются в store
- Разбирает WsEvent: `metrics` → `store.addMetric()`, `server_removed` → `store.removeServer()`
- Экспортирует `connected: Ref<boolean>` для UI
- Автоотключение через `onUnmounted`

### UI-компоненты

- **`ServerCard`** — карточка сервера: имя, IP, тип, CPU/RAM с цветовым индикатором (<60% зелёный, 60–85% жёлтый, >85% красный), CPU-алерт
- **`ServerList`** — грид карточек с событиями `select` и `delete`
- **`MetricChart`** — график CPU/RAM (vue-chartjs), последние 30 точек
- **`ServerForm`** — форма добавления с валидацией (name 2–30, IPv4, type)
- **`ConfirmDeleteModal`** — модалка подтверждения удаления
- **`ServerDetailModal`** — модалка с графиком по клику на карточку
- **`ModalWrapper`** — переиспользуемый Teleport-модал
- **`ConnectionStatus`** — индикатор подключения WebSocket

### Тесты (`__tests__/serverStore.spec.ts`) — 6 тестов

- Добавление метрики в store
- Обрезка истории до 30 точек (35 вставок → 30)
- CPU-алерт: >90% в течение 10+ секунд → true
- CPU-алерт: сброс при падении CPU ниже 90%
- CPU-алерт: не срабатывает при коротком всплеске (<10 сек)
- Сброс алерта при удалении сервера
