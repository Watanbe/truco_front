export interface Message {
    id?: number,
    text?: string,
    userId?: string,
    userName?: string,
    type: string,
    bgColor?: string,
}

export interface User {
    id: string,
    username: string,
    room?: string
}

export interface AlertType {
    message: string,
    variant: string,
    countdown?: number
}

export interface EventData {
    event: string,
    data: any
}

export interface RoomMessage {
    status: number,
    message: string,
}