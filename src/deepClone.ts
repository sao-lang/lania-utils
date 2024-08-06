/**
 * @name deepClone
 * @description 深拷贝函数
 * @param {T} obj 目标对象
 * @returns {T} 目标对象的一个副本
 */
export function deepClone<T>(value: T, map: WeakMap<object, any> = new WeakMap()): T {
    // 处理 null、undefined、以及原始值（如字符串、数字、布尔值等）
    if (value === null || typeof value !== 'object') {
        return value;
    }

    // 处理循环引用的情况
    if (map.has(value as object)) {
        return map.get(value as object);
    }

    // 处理数组
    if (Array.isArray(value)) {
        const arrClone: any[] = [];
        map.set(value, arrClone);
        for (const item of value) {
            arrClone.push(deepClone(item, map));
        }
        return arrClone as T;
    }

    // 处理对象
    const objClone: Record<string, any> = {};
    map.set(value, objClone);
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            objClone[key] = deepClone((value as Record<string, any>)[key], map);
        }
    }
    return objClone as T;
}
