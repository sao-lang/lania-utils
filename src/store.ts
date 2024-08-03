
export interface ModuleState {
    [key: string]: any;
}

export interface ModuleAction {
    type: string;
    payload?: any;
}

export interface Module {
    getInitialState(): ModuleState;
    reducer(state: ModuleState, action: ModuleAction): ModuleState;
    actions: { [key: string]: (payload?: any) => ModuleAction };
}
type Modules = { [key: string]: Module };
export interface StorePlugin {
    onInit?(store: Store): void;
    onDispatch?(action: any): void;
    onSubscribe?(listener: () => void): void;
    onStateChange?(newState: any): void;
}

export class Store {
    private state: { [key: string]: ModuleState } = {};
    private reducers: { [key: string]: (state: ModuleState, action: ModuleAction) => ModuleState } = {};
    private listeners: (() => void)[] = [];
    private plugins: StorePlugin[] = [];

    constructor(modulesOrModule: Module | Modules) {
        if (this.isModule(modulesOrModule)) {
            // Single module case
            const module = modulesOrModule;
            this.state['default'] = module.getInitialState();
            this.reducers['default'] = module.reducer;
        } else {
            // Module collection case
            const modules = modulesOrModule;
            Object.keys(modules).forEach(key => {
                const module = modules[key];
                this.state[key] = module.getInitialState();
                this.reducers[key] = module.reducer;
            });
        }
        this.initPlugins();
    }

    getState() {
        return this.state;
    }

    setState(newState: { [key: string]: ModuleState }) {
        this.state = newState;
        this.notifyPlugins('onStateChange', newState);
    }

    dispatch(action: ModuleAction) {
        Object.keys(this.reducers).forEach(key => {
            this.state[key] = this.reducers[key](this.state[key], action);
        });
        this.notify();
        this.notifyPlugins('onDispatch', action);
    }

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        this.notifyPlugins('onSubscribe', listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(listener => listener());
    }

    private notifyPlugins(hook: keyof StorePlugin, arg: any) {
        this.plugins.forEach(plugin => {
            if (plugin[hook]) {
                plugin[hook]!(arg);
            }
        });
    }

    private initPlugins() {
        this.plugins.forEach(plugin => {
            if (plugin.onInit) {
                plugin.onInit(this);
            }
        });
    }

    private isModule(arg: any): arg is Module {
        return 'getInitialState' in arg && 'reducer' in arg && 'actions' in arg;
    }

    use(plugin: StorePlugin) {
        this.plugins.push(plugin);
        plugin.onInit?.(this);
    }

    unuse(plugin: StorePlugin) {
        this.plugins = this.plugins.filter(p => p !== plugin);
    }
}
