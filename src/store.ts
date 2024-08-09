import { deepClone } from './tools';

type ActionType = string;

export interface AsyncAction {
    type: ActionType;
    payload?: any;
    asyncFunc?: (state: any) => Promise<any>;
}

export type DerivedState<S> = {
    [K in keyof S]?: (state: S) => S[K];
};

export type StorePlugin<S extends Record<string, any> = any> = {
    onInit?: (store: Store<S>) => void;
    onStateChange?: (store: Store<S>, newState: S, oldState: S) => void;
    onError?: (store: Store<S>, error: Error) => void;
};

export type PathType<
    T,
    P extends string,
> = P extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
        ? PathType<T[Key], Rest>
        : never
    : P extends keyof T
      ? T[P]
      : never;

export type FromPathType<P extends string, S, K> = P extends ''
    ? S
    : PathType<K, P>;

export class Store<S extends Record<string, any>> {
    private state: S;
    private reducers?: Record<ActionType, (state: S, payload?: any) => S>;
    private plugins: StorePlugin<S>[];
    private subscribers: Set<(state: S) => void>;
    private watchedProperties: Map<
        string,
        {
            callback: (newValue: any, oldValue: any) => void;
            value: any;
            immediate: boolean;
            deep: boolean;
        }
    >;
    private derivedState: DerivedState<S>;
    private snapshots: S[] = [];

    constructor({
        initialState,
        reducers,
        derivedState = {},
        plugins = [],
    }: {
        initialState: S;
        reducers?: Record<ActionType, (state: S, payload?: any) => S>;
        derivedState?: DerivedState<S>;
        plugins?: StorePlugin<S>[];
    }) {
        this.state = initialState;
        this.reducers = reducers;
        this.derivedState = derivedState;
        this.plugins = plugins;
        this.subscribers = new Set();
        this.watchedProperties = new Map();
        this.initializePlugins();
    }

    public getState<P extends string = ''>(path?: P): FromPathType<P, S, S> {
        return path
            ? (this.getNestedValue(this.state, path) as PathType<S, P>)
            : (this.state as any);
    }

    public getDerivedState<P extends string = ''>(
        path?: P,
    ): FromPathType<P, Partial<S>, DerivedState<S>> {
        const derivedState = Object.fromEntries(
            Object.entries(this.derivedState).map(([key, func]) => [
                key,
                func!(this.state),
            ]),
        ) as Partial<S>;

        return path
            ? (this.getNestedValue(derivedState, path) as PathType<
                  DerivedState<S>,
                  P
              >)
            : (derivedState as any);
    }

    public async dispatch(
        actionOrActions: AsyncAction | AsyncAction[],
    ): Promise<void> {
        try {
            const actions = Array.isArray(actionOrActions)
                ? actionOrActions
                : [actionOrActions];
            const oldState = { ...this.state };
            for (const action of actions) {
                if (action.asyncFunc) {
                    try {
                        action.payload = await action.asyncFunc(this.state);
                    } catch (error) {
                        console.error('Async action failed:', error);
                        continue; // 如果异步任务失败，跳过此action
                    }
                }

                const reducer = this.reducers?.[action.type];
                if (reducer) {
                    this.state = reducer(this.state, action.payload);
                } else {
                    console.warn(
                        `No reducer found for action type: ${action.type}`,
                    );
                }
            }
            this.notifyWatchers(this.state);
            this.subscribers.forEach((subscriber) => subscriber(this.state));
            this.plugins.forEach((plugin) =>
                plugin.onStateChange?.(this, this.state, oldState),
            );
        } catch (e) {
            this.plugins.forEach((plugin) => {
                plugin?.onError?.(this, e as Error);
            });
            throw e;
        }
    }

    private notifyWatchers(newState: S): void {
        this.watchedProperties.forEach((data, path) => {
            const newValue = this.getNestedValue(newState, path);
            if (newValue !== data.value) {
                data.callback(newValue, data.value);
                data.value = newValue;
            }
        });
    }

    public addPlugin(plugin: StorePlugin<S> | StorePlugin<S>[]): void {
        this.plugins.push(...(Array.isArray(plugin) ? plugin : [plugin]));
        this.initializePlugins();
    }

    private initializePlugins(): void {
        this.plugins.forEach((plugin) => plugin.onInit?.(this));
    }

    public subscribe(subscriber: (state: S) => void): () => void {
        this.subscribers.add(subscriber);
        return () => this.subscribers.delete(subscriber);
    }

    public watchProperty<P extends string>(
        path: P,
        callback: (
            newValue: FromPathType<P, S, S>,
            oldValue: FromPathType<P, S, S>,
        ) => void,
        options: { immediate?: boolean; deep?: boolean } = {},
    ): () => void {
        const { immediate = false, deep = false } = options;
        const initialValue = this.getNestedValue(this.state, path);
        this.watchedProperties.set(path, {
            callback,
            value: initialValue,
            immediate,
            deep,
        });
        if (deep) {
            this.applyDeepProxy(path, initialValue);
        }
        if (immediate) {
            callback(initialValue, initialValue);
        }
        return () => this.watchedProperties.delete(path);
    }

    private applyDeepProxy(path: string, obj: any): void {
        const handler = {
            set: (target: any, prop: string | symbol, value: any): boolean => {
                const oldValue = target[prop];
                if (oldValue !== value) {
                    target[prop] = value;
                    const fullPath = `${path}.${String(prop)}`;
                    const watchData = this.watchedProperties.get(fullPath);
                    if (watchData) {
                        watchData.callback(value, oldValue);
                        this.notifyWatchers(this.state);
                    }
                    if (typeof value === 'object' && value !== null) {
                        this.applyDeepProxy(fullPath, value);
                    }
                }
                return true;
            },
        };

        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                obj[key] = new Proxy(obj[key], handler);
            }
        }

        this.state = new Proxy(this.state, handler);
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((o, p) => o && o[p], obj);
    }

    // 状态快照和恢复功能
    public saveSnapshot(): void {
        this.snapshots.push(deepClone(this.state));
    }

    public restoreSnapshot(): void {
        if (this.snapshots.length > 0) {
            this.state = this.snapshots.pop()!;
            this.notifyWatchers(this.state);
            this.subscribers.forEach((subscriber) => subscriber(this.state));
        } else {
            console.warn('No snapshots available to restore.');
        }
    }
}
