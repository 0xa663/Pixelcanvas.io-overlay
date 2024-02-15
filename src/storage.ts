export class Storage {

    constructor(private chrome: boolean) {}

    getItem<V>(key: string): Promise<V | null> {
        if (this.chrome) {
            return new Promise<V | null>(r => {
                chrome.storage.local.get(key, value => {
                    if (value && value[key]) {
                        r(JSON.parse(value[key]));
                    } else {
                        r(null);
                    }
                });
            });
        } else {
            const value = localStorage.getItem(key);
            return Promise.resolve(value ? JSON.parse(value) : value);
        }
    }
    async setItem<V>(key: string, value: V) {
        if (this.chrome) {
            return new Promise<void>(r => {
                chrome.storage.local.set({ [key]: JSON.stringify(value) }, r);
            });
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
        return Promise.resolve();
    }
    deleteItem(key: string) {
        if (this.chrome) {
            return new Promise<void>(r => {
                chrome.storage.local.remove(key, r);
            });
        } else {
            localStorage.removeItem(key);
        }
        return Promise.resolve();
    }
}