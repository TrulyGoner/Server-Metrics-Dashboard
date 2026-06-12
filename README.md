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
    types/           — интерфейсы Server, MetricPoint, WsEvent
    store/           — Pinia store (серверы + история метрик + CPU-алерты)
    composables/     — useMetricsSocket (WebSocket с auto-reconnect)
    components/      — ServerCard, ServerList, ServerForm, MetricChart, ConnectionStatus
    __tests__/       — unit-тесты store (5 тестов)
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

### Типы (`types/`)

- **`server.ts`** — интерфейсы `Server` (id, name, ip, type) и `ServerCreate`
- **`metrics.ts`** — интерфейс `MetricPoint` (server_id, cpu, memory, timestamp)
- **`ws.ts`** — интерфейсы `MetricsEvent`, `ServerRemoveEvent` и объединение `WsEvent`

### Store (`store/serverStore.ts`)

- **`servers`** — `Record<string, Server>` — нормализованное хранение по id
- **`metricsHistory`** — `Map<string, MetricPoint[]>` — до 30 последних точек на сервер
- **`cpuAlerts`** — `Record<string, boolean>` — флаг алерта CPU > 90% дольше 10 сек
- **`serverList`** — `computed` — массив серверов для итерации в шаблоне
- **`latestMetrics`** — `computed` — последняя метрика для каждого сервера
- **`addMetric()`** — добавляет точку, обрезает до 30, вычисляет CPU-алерт (считает длительность серии подряд > 90%)
- **`removeServer()`** — удаляет сервер и его метрики с алертами

### Composable (`composables/useMetricsSocket.ts`)

- Подключается к `ws://<host>/ws`
- Auto-reconnect через 3 секунды при обрыве
- Pause/Resume — при паузе метрики не записываются в store
- Разбирает WsEvent: `metrics` → `store.addMetric()`, `server_removed` → `store.removeServer()`
- Экспортирует `connected: Ref<boolean>` для UI
- Автоотключение через `onUnmounted`

### Компоненты

- **`ServerCard`** — карточка сервера: имя, IP, тип, текущие CPU/RAM с цветовым индикатором (<60% зелёный, 60–85% жёлтый, >85% красный), кнопка удаления, отображение CPU-алерта
- **`ServerList`** — грид карточек с пробросом событий `select` и `delete`
- **`ServerForm`** — форма добавления: валидация name (2–30 символов), IPv4 (regex + диапазон), type (select), POST на `/api/servers`
- **`MetricChart`** — график CPU/RAM (vue-chartjs + Chart.js), последние 30 точек, обновление в реальном времени, открывается в модалке по клику на карточку
- **`ConnectionStatus`** — индикатор подключения к WebSocket (зелёный/красный)

### Тесты (`__tests__/serverStore.spec.ts`)

- Добавление метрики в store (проверка сохранения и значения)
- Обрезка истории до 30 точек (35 вставок → 30 осталось)
- CPU-алерт: >90% в течение 10+ секунд → true
- CPU-алерт: сброс при падении CPU ниже 90%
- CPU-алерт: не срабатывает при коротком всплеске (<10 сек)
- Сброс алерта при удалении сервера
