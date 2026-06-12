import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { Server, MetricPoint } from './types'
import { MAX_HISTORY_POINTS, CPU_ALERT_THRESHOLD, CPU_ALERT_DURATION_MS } from '@/shared/config/metric'

function computeCpuAlert(point: MetricPoint, history: MetricPoint[]): boolean {
    if (point.cpu <= CPU_ALERT_THRESHOLD) return false
    const reversed = [...history].reverse()
    let streakStartTs: string | null = null
    for (const m of reversed) {
        if (m.cpu > CPU_ALERT_THRESHOLD) {
            streakStartTs = m.timestamp
        } else {
            break
        }
    }
    if (!streakStartTs) return false
    const elapsed = new Date(point.timestamp).getTime() - new Date(streakStartTs).getTime()
    return elapsed >= CPU_ALERT_DURATION_MS
}

export const useServerStore = defineStore('server', () => {
    const servers = ref<Record<string, Server>>({})
    const metricsHistory = reactive(new Map<string, MetricPoint[]>())
    const cpuAlerts = ref<Record<string, boolean>>({})
    const serverList = computed(() => Object.values(servers.value))

    const latestMetrics = computed(() => {
        const map: Record<string, MetricPoint | null> = {}
        for (const [id, history] of metricsHistory) {
            map[id] = history.length > 0 ? history[history.length - 1] : null
        }
        return map
    })

    function setServers(list: Server[]): void {
        const map: Record<string, Server> = {}
        for (const s of list) {
            map[s.id] = s
        }
        servers.value = map
    }

    function addServer(server: Server): void {
        servers.value[server.id] = server
    }

    function removeServer(id: string): void {
        const s = { ...servers.value }
        delete s[id]
        servers.value = s
        metricsHistory.delete(id)
        const a = { ...cpuAlerts.value }
        delete a[id]
        cpuAlerts.value = a
    }

    function addMetric(point: MetricPoint): void {
        const sid = point.server_id
        const history = metricsHistory.get(sid) ?? []
        const updated = [...history, point].slice(-MAX_HISTORY_POINTS)
        metricsHistory.set(sid, updated)

        cpuAlerts.value = {
            ...cpuAlerts.value,
            [sid]: computeCpuAlert(point, updated),
        }
    }

    return {
        servers,
        metricsHistory,
        cpuAlerts,
        serverList,
        latestMetrics,
        setServers,
        addServer,
        removeServer,
        addMetric,
    }
})
