import { Store, StorePlugin } from './store';

export class PersistencePlugin implements StorePlugin {
    private storageKey: string;

    constructor(storageKey: string) {
        this.storageKey = storageKey;
    }
    onInit(store: Store) {
        const savedState = localStorage.getItem(this.storageKey);
        if (savedState) {
            store.setState(JSON.parse(savedState));
        }
    }
    onStateChange(newState: any) {
        localStorage.setItem(this.storageKey, JSON.stringify(newState));
    }
}