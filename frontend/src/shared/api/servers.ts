import type { Server, ServerCreate } from '@/entities/server'

export async function fetchServers(): Promise<Server[]> {
    const res = await fetch('/api/servers')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function createServer(data: ServerCreate): Promise<Server> {
    const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export async function deleteServer(id: string): Promise<void> {
    const res = await fetch(`/api/servers/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
