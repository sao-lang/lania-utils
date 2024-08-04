/**
 * @name deepClone
 * @description 深拷贝函数
 * @param {T} obj 目标对象
 * @returns {T} 目标对象的一个副本
 */
export const deepClone = <T>(origin: T, target?: Record<string, any> | T): T => {
    let tar = target || {};
    for (const key in origin) {
        if (Object.prototype.hasOwnProperty.call(origin, key)) {
            if (
                typeof origin[key] === 'object' &&
                typeof origin[key] !== null
            ) {
                tar[key] = Array.isArray(origin[key]) ? [] : {};
                deepClone(origin[key], tar[key]);
            } else {
                tar[key] = origin[key];
            }
        }
    }
    return tar as T;
};
