import type { MetricPoint } from "./metrics";

export interface MetricsEvent {
    type: 'metrics'
    payload: MetricPoint
}

export interface ServerRemoveEvent {
    type: 'server_removed'
    payload: { serverId: string}
}

export type WsEvent = MetricsEvent | ServerRemoveEvent