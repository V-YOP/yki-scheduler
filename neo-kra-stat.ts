#!/usr/bin/env node


import path from 'path'
import { readFileSync, cpSync, readdirSync } from 'fs'
import { execSync } from 'child_process'

export function dayKraStats(): Record<string, number> {

    const DAY_DURATION = 24 * 60 * 60 * 1000

    const HISTORY_PATH = path.join('C:/Users/Administrator', '.kra_history', 'history')
    const fileContent = readFileSync(HISTORY_PATH).toString('utf-8')

    const datas = fileContent.split(/\r?\n/).map(x => x.trim()).filter(x => x && x !== '').map(x => {
        const xs = x.split('##')
        return [new Date(xs[0]), +xs[3]] as [Date, number]
    })

    function getBelongDate(date: Date) {
        if (date.getHours() <= 6) {
            date = new Date(+date - DAY_DURATION)
        }
        return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    }
    function toYYMMDD(date: Date) {
        const year = date.getFullYear().toString().substring(2)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = (date.getDate()).toString().padStart(2, '0')
        return `${year}${month}${day}`
    }


    const end = getBelongDate(datas[datas.length - 1][0])
    const start = getBelongDate(new Date(+end - DAY_DURATION * 366 * 2))
    // console.log(start, end, end.getDate(), end.getHours())

    const dateSums = groupByAnd(datas, x => toYYMMDD(getBelongDate(x[0])), arr => Math.round(arr.reduce((acc, [, x]) => acc + x, 0) / 60))

    function groupByAnd<T, R>(arr: T[], f: (item: T) => string, m: (arr: T[]) => R): Record<string, R> {
        const res: Record<string, any> = {}
        for (const item of arr) {
            const key = f(item)
            if (!res[key]) res[key] = []
            res[key].push(item)
        }
        for (const key of Object.keys(res)) {
            res[key] = m(res[key])
        }
        return res
    }
    return dateSums
}