import { ref, onUnmounted } from 'vue'
import type { WsEvent } from '@/types/ws'
import { useServerStore } from '@/store/serverStore'

export function useMetricsSocket() {
    const connected = ref(false)
    const paused = ref(false)
    const store = useServerStore()
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let shouldReconnect = true

    function connect(): void {
        ws = new WebSocket(`ws://${window.location.host}/ws`)
        ws.onopen = () => {
            connected.value = true
        }

        ws.onclose = () => {
            connected.value = false
            if (shouldReconnect) {
                reconnectTimer = setTimeout(connect, 3000)
            }
        }

        ws.onmessage = (event: MessageEvent<string>) => {
            try {
                const data: WsEvent = JSON.parse(event.data)
                if (data.type === 'metrics') {
                    if (!paused.value) {
                        store.addMetric(data.payload)
                    }
                } else if (data.type === 'server_removed') {
                    store.removeServer(data.payload.serverId)
                }
            } catch (e) {
                console.error('Failed to parse WS message:', e)
            }
        }
    }

    function disconnect(): void {
        shouldReconnect = false
        if (reconnectTimer !== null) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
        if (ws) {
            ws.close()
            ws = null
        }
    }

    function pause(): void {
        paused.value = true
    }

    function resume(): void {
        paused.value = false
    }

    connect()

    onUnmounted(disconnect)

    return { connected, paused, pause, resume }
}
    

