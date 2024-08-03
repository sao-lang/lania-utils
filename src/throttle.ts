type Fn = (...args: any) => any;
type FnArgsType<F extends Function> = F extends (...args: infer A) => any ? A : never;
type FnReturnType<K extends Fn> = (...args: FnArgsType<K>) => ReturnType<K>;
type ThrottleOptions = { leading?: boolean; trailing?: boolean };
/**
 * @name throttle
 * @description 节流函数
 * @param {(...args: unknown[]) => unknown} fn 回调函数
 * @param {number} wait 间隔时间
 * @param {ThrottleOptions} options leading  开始就执行 trailing 最后也执行，两者相斥
 */
export const throttle = <T extends Fn>(
    func: T,
    wait = 1000,
    options?: ThrottleOptions,
): FnReturnType<T> & { cancel: () => void } => {
    // eslint-disable-next-line no-undef
    let timeout: NodeJS.Timeout | null = null;
    let previous = 0;
    let result: ReturnType<T>;
    if (!options) {
        options = {};
    }
    function throttled(this: unknown, ...args: FnArgsType<T>) {
        const now: number = new Date().getTime();
        if (!previous && options?.leading === false) {
            previous = now;
        }
        const remaining: number = wait - (now - previous);
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(this, args);
        } else if (!timeout && options?.trailing !== false) {
            timeout = setTimeout(() => {
                previous = options?.leading === false ? 0 : Date.now();
                timeout = null;
                result = func.apply(this, args);
            }, remaining);
        }
        return result;
    }
    throttled.cancel = function () {
        if (timeout) {
            clearTimeout(timeout);
        }
        previous = 0;
    };
    return throttled;
};
