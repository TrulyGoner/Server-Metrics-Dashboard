export interface Server {
    id: string
    name: string
    ip: string
    type: 'physical' | 'virtual' | 'container'
}

export interface ServerCreate {
    name: string
    ip: string
    type: 'physical' | 'virtual' | 'container'
}

export interface MetricPoint {
    server_id: string
    cpu: number
    memory: number
    timestamp: string
}

export interface MetricsEvent {
    type: 'metrics'
    payload: MetricPoint
}

export interface ServerRemoveEvent {
    type: 'server_removed'
    payload: { serverId: string }
}

export type WsEvent = MetricsEvent | ServerRemoveEvent
