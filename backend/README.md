# Server Metrics API — Backend

REST API + WebSocket на FastAPI для мониторинга серверов в реальном времени.

## Запуск

```bash
uvicorn main:app --reload --port 3001
```

## Стек

- Python 3.12
- FastAPI
- Pydantic (валидация схем)
- uvicorn (ASGI-сервер)
- websockets (WebSocket)

## Структура

```
backend/
  main.py            — FastAPI-приложение: REST + WebSocket + фоновая задача
  requirements.txt   — зависимости Python
  README.md          — этот файл
```

## Pydantic-схемы (`main.py`)

| Модель | Поля | Валидация |
|--------|------|-----------|
| `ServerCreate` | `name`, `ip`, `type` | name: 2–30 символов; ip: IPv4 (regex + октеты ≤255); type: `Literal["physical", "virtual", "container"]` |
| `ServerUpdate` | `name` | name: 2–30 символов |
| `Server` | `id`, `name`, `ip`, `type` | response model |
| `MetricPoint` | `server_id`, `cpu`, `memory`, `timestamp` | WebSocket payload |

## API

| Метод | Путь | Описание |
|-------|------|---------|
| `GET` | `/api/servers` | Список всех серверов |
| `POST` | `/api/servers` | Создать сервер (с валидацией) |
| `PUT` | `/api/servers/{id}` | Обновить имя сервера |
| `DELETE` | `/api/servers/{id}` | Удалить сервер |
| `WS` | `/ws` | WebSocket: метрики CPU/RAM каждые 2 сек |

## WebSocket-события

```json
// metrics — каждые 2 секунды на каждый сервер
{"type": "metrics", "payload": {"server_id": "abc", "cpu": 42.5, "memory": 67.3, "timestamp": "2026-06-12T12:00:00Z"}}

// server_removed — при DELETE /api/servers/{id}
{"type": "server_removed", "payload": {"serverId": "abc"}}
```

## Фоновая задача

`metrics_loop()` генерирует случайные CPU (0–95%) и RAM (10–90%) для каждого сервера каждые 2 секунды и рассылает через `broadcast()` по всем активным WebSocket-соединениям.

## Lifespan

`lifespan()` — asynccontextmanager: при старте инициализирует in-memory БД (3–5 случайных серверов) и запускает `metrics_loop`; при остановке отменяет фоновую задачу.
