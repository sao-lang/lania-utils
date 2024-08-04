interface Listener {
    cb?: (...args: unknown[]) => void;
    once?: boolean;
}
class EventBus {
    private events: Record<string, Listener[]> = {};
    public on(
        eventName: string,
        cb: (...args: unknown[]) => void,
        once?: boolean,
    ) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        !!cb && this.events[eventName].push({ cb, once });
    }

    public emit(eventName: string, ...args: unknown[]) {
        const ev = this.events[eventName];
        if (!ev || !ev.length) {
            return;
        }
        let length = ev.length;
        for (let i = 0; i <= length - 1; i++) {
            const { cb, once } = ev[i];
            !!cb && cb.apply(this, args);
            if (once) {
                ev.splice(i, 1);
                i--;
                length--;
            }
        }
    }

    public once(eventName: string, cb: (...args: unknown[]) => void) {
        this.on(eventName, cb, true);
    }

    public off(eventName: string, cb: (...args: unknown[]) => void) {
        const ev = this.events[eventName];
        if (!eventName || !ev || !ev.length) {
            return;
        }
        if (!cb) {
            delete this.events[eventName];
            return;
        }
        let length = ev.length;
        for (let i = 0; i <= length - 1; i++) {
            if (ev[i].cb?.toString() === cb?.toString()) {
                ev.splice(i, 1);
                length--;
                i--;
            }
        }
    }

    public clear() {
        this.events = {};
    }
}

export default EventBus;
