export interface Server {
    id: string
    name:string
    ip: string
    type: 'physical' | 'virtual' | 'container'
}

export interface ServerCreate {
    name: string
    ip: string
    type: 'physical' | 'virtual' | 'container'
}