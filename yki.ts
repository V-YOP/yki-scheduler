declare global {
    interface Object {
        $let: <T, R>(this: T, mapper: (t: T) => R) => R
    }
}
Object.prototype.$let = function(mapper) {
    return mapper(this)
}

export function get<T, R extends keyof T>(fieldName: R): (obj: T) => T[R] {
    return obj => obj[fieldName]
}

export function id<T>(t: T) {
    return t
}

export const identity = id

export function constant<T>(x: T): (any?: any | void) => T {
    return () => x
}

export function map<T, R>(mapper: (item: T) => R): (arr: T[]) => R[] {
    return arr => arr.map(x => mapper(x))
}

export function groupBy<T>(arr: T[], keyMapper: (item: T) => string | number): Record<string, T[]>;
export function groupBy<T, R>(arr: T[], keyMapper: (item: T) => string | number, resMapper: (group: T[]) => R): Record<string, R>;
export function groupBy<T, R>(arr: T[], keyMapper: (item: T) => string | number, resMapper?: (group: T[]) => R): Record<string, R> {
    const res: Record<string, any> = {}
    for (const x of arr) {
        const key = keyMapper(x)
        if (!res[key]) {
            res[key] = []
        }
        res[key].push(x)
    }
    for (const key of Object.keys(res)) {
        res[key] = (resMapper ?? id)(res[key])
    }
    return res
}

export function join(arr: any[], separator: string = '', prefix: string = '', suffix: string = ''): string {
    return `${prefix}${arr.join(separator)}${suffix}`
}

export function interpolate<T, R>(arr: T[], supplier: (() => R) | R): (T | R)[] {
    if (!arr || arr.length === 0) {
        return []
    }
    const res = new Array(arr.length * 2 - 1)
    res[0] = arr[0]
    for (let i = 1; i < arr.length; i++) {
        let v
        if (typeof supplier === 'function') {
            v = (supplier as Function)() 
        } else {
            v = supplier
        }
        res[i * 2 - 1] = v
        res[i * 2] = arr[i]
    }
    return res
}


export function zipWith<T, R, U>(arr1: T[], arr2: R[], fn: (a: T, b: R) => U): U[] {
    const res = new Array(arr1.length)
    for (let i = 0; i < arr1.length; i++) {
        res[i] = fn(arr1[i], arr2[i])
    }
    return res
}

export function hhMM(date: Date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function yyyyMMDDHHmmss(date: Date) {
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${yyyyMMDD(date)} ${hhMM(date)}:${seconds}`;
}

export function yyyyMM(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

export function yyyyMMDD(date: Date) {
    const day = date.getDate().toString().padStart(2, '0');
    return `${yyyyMM(date)}-${day}`;
}

export function getBelongDate(date: Date) {
    if (date.getHours() <= 6) {
        date = new Date(+date - 24 * 60 * 60 * 1000)
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * convert date to 'yyMMdd' pattern 
 * @param date 
 * @returns 
 */
export function dayKey(date: Date) {
    const year = date.getFullYear().toString().substring(2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = (date.getDate()).toString().padStart(2, '0')
    return `${year}${month}${day}`
}

export function shuffle<T>(arr: T[]): T[] {
    const len = arr.length
    for (let i = 0; i < len; i++) {
        const j = Math.floor(Math.random() * (len - i)) + i
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
    return arr
}

export function randonItem<T>(arr: T[]): T | undefined {
    if (!arr || arr.length === 0) {
        return undefined
    }
    return arr[Math.floor(Math.random() * arr.length)]
}

export function mkSemaphare(count = 1) {
    const cbs: (() => void)[] = []
    return {
        wait: () => new Promise(resolve => {
            if (count > 0) {
                resolve(null)
                count--
            } else {
                cbs.push(() => resolve((null)))
            }
        }),
        signal: () => {
            count++
            const cb = cbs.shift()
            cb && cb()
        }
    }
}