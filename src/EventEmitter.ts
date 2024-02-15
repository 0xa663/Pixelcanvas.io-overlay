import { pushUnique, removeItem } from "./utils";

export type Listener<A extends Array<any>, R = void> = (...args: A) => R;
export type Key = number | string;
export class BasicEventEmitter<K = Key, A extends Array<any> = any[], R = void> {
    private listeners = new Map<K, Listener<A, R>[]>();

    on(type: K, listener: Listener<A, R>) {
        const arr = this.listeners.get(type) || [];
        pushUnique(arr, listener);
        this.listeners.set(type, arr);
    }

    off(type: K, listener: Listener<A, R>) {
        const arr = this.listeners.get(type) || [];
        removeItem(arr, listener);
        if (!arr.length) {
            this.listeners.delete(type);
        }
    }

    emit(type: K, ...args: A) {
        const listeners = this.listeners.get(type);
        if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                try {
                    const listener = listeners[i];
                    if (listener) {
                        listener(...args);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    listenersCount(type: K) {
        const arr = this.listeners.get(type);
        return arr ? arr.length : 0;
    }

    removeAllListeners() {
        this.listeners.clear();
    }

    removeSpecificListeners(type: K) {
        this.listeners.delete(type);
    }
}
