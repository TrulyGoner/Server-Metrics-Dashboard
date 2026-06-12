# Server Metrics Dashboard

Dashboard для мониторинга серверов в реальном времени через WebSocket.

## Стек

- **Frontend:** Vue 3 + TypeScript + Pinia + Vite + Chart.js
- **Backend:** FastAPI (Python 3.12+)

---

## Запуск

### Бэкенд

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 3001
```

Swagger: `http://localhost:3001/docs`

### Фронтенд

```bash
cd frontend\metricDashboard
npm install
npm run dev
```

Открыть `http://localhost:5173`

> Vite проксирует `/api` и `/ws` на `localhost:3001`.

---

## Тесты

```bash
cd frontend\metricDashboard
npm test
```

6 unit-тестов (Vitest):
- добавление метрики в store
- обрезка истории до 30 точек
- CPU alert при 5 подряд > 90%
- сброс CPU alert при снижении < 90%
- сброс alert при удалении сервера

---

## Функционал

| Фича | Описание |
|------|----------|
| **Список серверов** | Карточки с именем, IP, типом, CPU/RAM, цветовой индикатор (< 60% зелёный, 60–85% жёлтый, > 85% красный) |
| **График** | Клик по карточке — модалка с Chart.js (CPU + RAM, последние 30 точек, обновляется в реальном времени) |
| **Форма добавления** | Валидация: name 2–30 символов, IPv4, select type (physical/virtual/container) |
| **WebSocket** | Auto-reconnect 3с, статус подключения в UI, удаление сервера через WS |
| **Pause / Resume** | Кнопка в хедере — замораживает обновление метрик (удаление серверов продолжает работать) |
| **CPU Alert** | Если CPU > 90% дольше 10 секунд (5 метрик подряд), на карточке красный бейдж |
| **Удаление** | Кнопка × на карточке → модалка подтверждения → DELETE запрос |

## Структура фронтенда

```
frontend\metricDashboard\src\
├── components/
│   ├── ConnectionStatus.vue   — индикатор подключения WS
│   ├── MetricChart.vue        — график CPU + RAM (Chart.js)
│   ├── ServerCard.vue         — карточка сервера
│   ├── ServerForm.vue         — форма добавления сервера
│   └── ServerList.vue         — сетка карточек
├── composables/
│   └── useMetricsSocket.ts    — WS composable (connect, reconnect, pause/resume)
├── store/
│   └── serverStore.ts         — Pinia store (серверы, метрики, CPU alerts)
├── types/
│   ├── metrics.ts             — MetricPoint interface
│   ├── server.ts              — Server / ServerCreate interfaces
│   └── ws.ts                  — WsEvent (MetricsEvent | ServerRemoveEvent)
├── __tests__/
│   └── serverStore.spec.ts    — Vitest тесты
├── App.vue                    — корневой компонент
├── main.ts                    — точка входа
└── style.css                  — глобальные стили
```
