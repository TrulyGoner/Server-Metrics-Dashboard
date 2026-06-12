export function validateIp(ip: string): boolean {
    const parts = ip.split('.')
    if (parts.length !== 4) return false
    return parts.every(p => {
        const n = Number(p)
        return !Number.isNaN(n) && n >= 0 && n <= 255 && p === n.toString()
    })
}
