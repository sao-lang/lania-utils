type StorePlugin = {
    onInit?: (store: Store) => void;
    onStateChange?: (
        store: Store,
        oldState: Record<string, any>,
        newState: Record<string, any>,
    ) => void;
};

import { deepClone } from './deepClone';

export class Store {
    private state: Record<string, any>;
    private plugins: StorePlugin[];
    private subscribers: Set<(state: Record<string, any>) => void>;
    private watchedProperties: Map<string, {
        callback: (newValue: any, oldValue: any) => void;
        value: any;
        immediate: boolean; // 添加 immediate 标志
    }>;

    constructor(initialState: Record<string, any> = {}) {
        this.state = initialState;
        this.plugins = [];
        this.subscribers = new Set();
        this.watchedProperties = new Map();
        this.initializePlugins(); // 初始化插件
    }

    getState<T>(): T {
        return this.state as T;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((o, p) => o && o[p], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        keys.slice(0, -1).reduce((acc, key, index) => {
            if (typeof acc[key] !== 'object' || acc[key] === null) {
                acc[key] = isNaN(Number(keys[index + 1])) ? {} : [];
            }
            return acc[key];
        }, obj)[keys[keys.length - 1]] = value;
    }

    private notifyWatchers(oldState: Record<string, any>, newState: Record<string, any>): void {
        this.watchedProperties.forEach((data, path) => {
            const newValue = this.getNestedValue(newState, path);
            const oldValue = this.getNestedValue(oldState, path);

            if (newValue !== data.value) {
                data.callback(newValue, data.value);
                data.value = newValue; // 更新记录的值
            }
        });
    }

    public setState(path: string | Record<string, any>, newValue?: any): void {
        const oldState = deepClone(this.state);

        if (typeof path === 'string') {
            this.setNestedValue(this.state, path, newValue);
        } else {
            this.state = path;
        }

        this.notifyWatchers(oldState, this.state);
        this.subscribers.forEach((subscriber) => subscriber(this.state));
        this.plugins.forEach((plugin) => {
            if (plugin.onStateChange) {
                plugin.onStateChange(this, oldState, this.state);
            }
        });
    }

    public addPlugin(plugin: StorePlugin | StorePlugin[]): void {
        if (Array.isArray(plugin)) {
            this.plugins.push(...plugin);
        } else {
            this.plugins.push(plugin);
        }
        this.initializePlugins();
    }

    private initializePlugins(): void {
        this.plugins.forEach((plugin) => {
            if (plugin.onInit) {
                // 立即调用 onInit 以确保插件能进行初始化操作
                plugin.onInit(this);
            }
        });
    }

    public subscribe(subscriber: (state: Record<string, any>) => void): () => void {
        this.subscribers.add(subscriber);
        return () => {
            this.subscribers.delete(subscriber);
        };
    }

    public watchProperty(
        path: string,
        callback: (newValue: any, oldValue: any) => void,
        immediate: boolean = false // 添加 immediate 参数
    ): () => void {
        const initialValue = this.getNestedValue(this.state, path);
        this.watchedProperties.set(path, { callback, value: initialValue, immediate });

        if (immediate) {
            callback(initialValue, initialValue);
        }

        return () => {
            this.watchedProperties.delete(path);
        };
    }
}
