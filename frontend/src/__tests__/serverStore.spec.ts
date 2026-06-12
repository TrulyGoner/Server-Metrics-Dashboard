import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useServerStore } from '@/store/serverStore'

describe('serverStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a metric point to the store', () => {
    const store = useServerStore()
    store.addMetric({
      server_id: 's1',
      cpu: 45,
      memory: 60,
      timestamp: '2024-01-01T00:00:00Z',
    })
    expect(store.serverMetrics('s1').value).toHaveLength(1)
    expect(store.serverMetrics('s1').value[0].cpu).toBe(45)
  })

  it('truncates history to 30 points', () => {
    const store = useServerStore()
    for (let i = 0; i < 35; i++) {
      store.addMetric({
        server_id: 's1',
        cpu: i,
        memory: i * 2,
        timestamp: '2024-01-01T00:00:00Z',
      })
    }
    expect(store.serverMetrics('s1').value).toHaveLength(30)
    expect(store.serverMetrics('s1').value[0].cpu).toBe(5)
  })

  it('sets cpuAlert when cpu > 90 for >= 10 seconds', () => {
    const store = useServerStore()
    const base = '2024-01-01T00:00:00Z'
    for (let i = 0; i < 6; i++) {
      store.addMetric({
        server_id: 's1',
        cpu: 95,
        memory: 50,
        timestamp: new Date(new Date(base).getTime() + i * 2000).toISOString(),
      })
    }
    // 6 points × 2s = 10s from first to last
    expect(store.isCpuAlert('s1').value).toBe(true)
  })

  it('clears cpuAlert when cpu drops below 90 after alert', () => {
    const store = useServerStore()
    const base = '2024-01-01T00:00:00Z'
    for (let i = 0; i < 6; i++) {
      store.addMetric({
        server_id: 's1',
        cpu: 95,
        memory: 50,
        timestamp: new Date(new Date(base).getTime() + i * 2000).toISOString(),
      })
    }
    expect(store.isCpuAlert('s1').value).toBe(true)

    store.addMetric({
      server_id: 's1',
      cpu: 50,
      memory: 50,
      timestamp: new Date(new Date(base).getTime() + 12000).toISOString(),
    })
    expect(store.isCpuAlert('s1').value).toBe(false)
  })

  it('does not set cpuAlert when cpu > 90 for less than 10 seconds', () => {
    const store = useServerStore()
    const base = '2024-01-01T00:00:00Z'
    for (let i = 0; i < 4; i++) {
      store.addMetric({
        server_id: 's1',
        cpu: 99,
        memory: 50,
        timestamp: new Date(new Date(base).getTime() + i * 2000).toISOString(),
      })
    }
    // 4 points × 2s = 6s < 10s
    expect(store.isCpuAlert('s1').value).toBe(false)
  })

  it('resets cpuAlert on removed server', () => {
    const store = useServerStore()
    store.addServer({ id: 's1', name: 'test', ip: '1.2.3.4', type: 'physical' })
    const base = '2024-01-01T00:00:00Z'
    for (let i = 0; i < 6; i++) {
      store.addMetric({
        server_id: 's1',
        cpu: 99,
        memory: 50,
        timestamp: new Date(new Date(base).getTime() + i * 2000).toISOString(),
      })
    }
    expect(store.isCpuAlert('s1').value).toBe(true)
    store.removeServer('s1')
    expect(store.isCpuAlert('s1').value).toBe(false)
  })
})