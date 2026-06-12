import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Server } from '@/types/server'
import type { MetricPoint } from '@/types/metrics'

export const useServerStore = defineStore('server', () => {
    const servers = ref<Record<string, Server>>({})
    const metricsHistory = ref(new Map<string, MetricPoint[]>())
    const cpuAlerts = ref<Record<string, boolean>>({})
    const serverList = computed(() => Object.values(servers.value))

    const latestMetrics = computed(() => {
        const map: Record<string, MetricPoint | null> = {}
        for (const [id, history] of metricsHistory.value) {
            map[id] = history.length > 0 ? history[history.length - 1] : null
        }
        return map
    })

    const serverMetricsList = computed(() => {
        const map: Record<string, MetricPoint[]> = {}
        for (const [id, history] of metricsHistory.value) {
            map[id] = history
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
        const m = new Map(metricsHistory.value)
        m.delete(id)
        metricsHistory.value = m
        const a = { ...cpuAlerts.value }
        delete a[id]
        cpuAlerts.value = a
    }

    function addMetric(point: MetricPoint): void {
        const sid = point.server_id
        const history = metricsHistory.value.get(sid) ?? []
        const updated = [...history, point].slice(-30)
        metricsHistory.value = new Map(metricsHistory.value).set(sid, updated)

        if (point.cpu > 90) {
            const reversed = [...updated].reverse()
            let streakStartTs: string | null = null
            for (const m of reversed) {
                if (m.cpu > 90) {
                    streakStartTs = m.timestamp
                } else {
                    break
                }
            }
            if (streakStartTs && streakStartTs.length > 0) {
                const elapsed = new Date(point.timestamp).getTime() - new Date(streakStartTs).getTime()
                cpuAlerts.value = {
                    ...cpuAlerts.value,
                    [sid]: elapsed >= 10000,
                }
            } else {
                cpuAlerts.value = {
                    ...cpuAlerts.value,
                    [sid]: false,
                }
            }
        } else {
            cpuAlerts.value = {
                ...cpuAlerts.value,
                [sid]: false,
            }
        }
    }

    function serverMetrics(id: string) {
        return computed(() => metricsHistory.value.get(id) ?? [])
    }

    function latestMetric(id: string) {
        return computed<MetricPoint | null>(() => {
            const h = metricsHistory.value.get(id)
            return h && h.length > 0 ? h[h.length - 1] : null
        })
    }

    function isCpuAlert(id: string) {
        return computed(() => cpuAlerts.value[id] ?? false)
    }

    return {
        servers,
        metricsHistory,
        cpuAlerts,
        serverList,
        latestMetrics,
        serverMetricsList,
        setServers,
        addServer,
        removeServer,
        addMetric,
        serverMetrics,
        latestMetric,
        isCpuAlert,
    }
})
