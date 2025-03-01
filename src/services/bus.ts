import { EventEmitter } from 'events'

const getBus = () => {
    return new EventEmitter()
}

declare const globalThis: {
    bus: EventEmitter
} & typeof global

const bus = globalThis.bus ?? getBus()

export { bus }

if (process.env.NODE_ENV !== 'production') globalThis.bus = bus