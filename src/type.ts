export type VarTypes =
    | 'number'
    | 'string'
    | 'boolean'
    | 'function'
    | 'object'
    | 'array'
    | 'date'
    | 'error'
    | 'set'
    | 'map'
    | 'regexp'
    | 'symbol'
    | 'bigint'
    | 'weakmap'
    | 'weakset'
    | 'arraybuffer'
    | 'json'
    | 'math'
    | 'null'
    | 'undefined';
/**
 * @name type
 * @description 判断变量类型
 * @param {unknown} obj 目标对象
 * @returns {string} 目标对象的变量类型字符串
 */
export const type = (obj: unknown): VarTypes => {
    const class2type: { [propName: string]: string } = {};
    const typeStr =
        'Boolean Null Number String Function Array Date RegExp Object Error Set Map WeakMap WeakSet ArrayBuffer';
    typeStr.split(' ').forEach(item => {
        class2type[`[object ${item}]`] = item.toLowerCase();
    });
    const type = Object.prototype.toString.call(obj);
    return typeof obj === 'object' ? (class2type[type] as VarTypes) : typeof obj;
};

/**
 * @name isFunction
 * @description 判断是否是函数，返回boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是函数，false-不是函数
 */
export const isFunction = (obj: unknown): boolean => type(obj) === 'function';

/**
 * @name isBoolean
 * @description 判断是否是boolean，返回boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是布尔值，false-不是布尔值
 */
export const isBoolean = (obj: unknown): boolean => type(obj) === 'boolean';
/**
 * @name isNumber
 * @description 判断是否是number，返回boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是数值，false-不是数值
 */
export const isNumber = (obj: unknown): boolean => type(obj) === 'number';
/**
 * @name isString
 * @description 判断是否是string，返回boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是字符串，false-不是字符串
 */
export const isString = (obj: unknown): boolean => type(obj) === 'string';

/**
 * @name isArray
 * @description 判断是否是数组，返回boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是数组，false-不是数组
 */
export const isArray = (obj: unknown): boolean => type(obj) === 'array';
/**
 * @name isArrayLike
 * @description 判断是否是类数组对象，boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是类数组对象，false-不是类数组对象
 */
export const isArrayLike = (obj: unknown): boolean => {
    const targetObj = obj as ArrayLike<unknown>;
    const length = !!obj && 'length' in targetObj && targetObj.length;
    const typeRes = type(obj);
    if (typeRes === 'function' || isWindow(obj)) {
        return false;
    }
    return (
        typeRes === 'array' ||
        length === 0 ||
        (typeof length === 'number' && length > 0 && length - 1 in targetObj)
    );
};

/**
 * @name isHTMLElement
 * @description 判断是否是标签，返回boolean
 * @param {unknown} obj 目标对象
 * @return {boolean} true-是标签，false-不是标签
 */
export const isHTMLElement = (obj: unknown): boolean =>
    !!(obj && (obj as HTMLElement).nodeType === 1);
/**
 * @name isWindow
 * @description 判断是否是window，返回boolean
 * @param {unknown} obj 目标对象
 * @returns {boolean} true-是window，false-不是window
 */
export const isWindow = (obj: unknown): boolean => obj !== null && obj === (obj as Window).window;
/**
 * @name isEmptyObject
 * @description 判断是否是空对象，返回boolean
 * @param {unknown} obj 目标对象
 * @returns true-是空对象，false-不是空对象
 */
export const isEmptyObject = (obj: unknown): boolean => {
    // eslint-disable-next-line no-unreachable-loop
    for (const _name in obj as object) {
        return false;
    }
    return true;
};

/**
 * @name isObject
 * @description 判断是否是对象，返回boolean
 * @param {unknown} obj 目标对象
 * @returns true-是对象，false-不是对象
 */
export const isObject = (obj: unknown): boolean => typeof obj === 'object' && obj !== null;
/**
 * @name isPrimitive
 * @description 判断是否是基本类型，返回boolean
 * @param {unknown} obj 目标对象
 * @returns true-是基本类型，false-不是基本类型
 */
export const isPrimitive = (obj: unknown): boolean => {
    const varType = type(obj);
    const flag =
        varType === 'bigint' ||
        varType === 'boolean' ||
        varType === 'null' ||
        varType === 'undefined' ||
        varType === 'string' ||
        varType === 'number' ||
        varType === 'symbol';
    return flag;
};

/**
 * @name isFalsy
 * @description 判断是否是假值，返回boolean
 * @param {unknown} obj 目标对象
 * @returns true-是假值，false-不是假值
 */
export const isFalsy = (obj: unknown): boolean => {
    if (obj === undefined || obj === null) {
        return true;
    }
    const objString = (obj as boolean | string | number).toString();
    return ['false', '0', 'NaN', '', '+0', '-0'].includes(objString);
};
