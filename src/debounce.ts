type Fn = (...args: any) => any;
type FnArgsType<F extends Function> = F extends (...args: infer A) => any ? A : never;
type FnReturnType<K extends Fn> = (...args: FnArgsType<K>) => ReturnType<K>;

/**
 * @name debounce
 * @description 防抖函数
 * @param {(...args: any[]) => unknown} fn 回调函数
 * @param {number} wait 间隔时间
 * @param {boolean} immediate 是否立即执行
 */
export const debounce = <T extends Fn>(
    fn: T,
    wait?: number,
    immediate?: boolean,
): FnReturnType<T> & { cancel: () => void } => {
    let timeout: NodeJS.Timeout | null;
    let result: ReturnType<T>;
    function debounced(this: unknown, ...args: FnArgsType<T>) {
        if (timeout) {
            clearTimeout(timeout);
        }
        if (immediate) {
            const callNow = !timeout;
            timeout = setTimeout(() => {
                timeout = null;
            }, wait || 1000);
            if (callNow) {
                result = fn.apply(this, args);
            }
        } else {
            timeout = setTimeout(() => {
                result = fn.apply(this, args);
            }, wait || 1000);
        }
        return result;
    }
    debounced.cancel = function () {
        if (timeout) {
            clearTimeout(timeout);
        }
    };
    return debounced;
};