import { Console } from "console";
import { WriteStream, createWriteStream, mkdirSync, readdirSync } from "fs";
import { homedir, tmpdir } from "os";
import { yyyyMMDDHHmmss, randonItem } from "./yki";
import path from "path";

export const TASK_INTERVAL = 100;

export const PIC_SAVE_PATH = `D:\\DESKTOP\\TMP\\CLIPBOARD`

export const KRA_HISTORY_PATH = path.resolve(homedir(), '.kra_history', 'history')
export const BASE_PATH = `${homedir()}/.yki_scheduler`;

mkdirSync(BASE_PATH, {recursive: true});

export const PID_FILE = `${BASE_PATH}/pid`;

export const TASK_DIR = `${BASE_PATH}/tasks`;
export const LOG_DIR = `${BASE_PATH}/logs`;

mkdirSync(TASK_DIR, {recursive: true});
mkdirSync(LOG_DIR, {recursive: true});

export const ICON_FILES = readdirSync(`${BASE_PATH}/icons`).map(x=>path.resolve(`${BASE_PATH}/icons`, x))

export function randomIcon(prefix: string): string | undefined {
    return randonItem(ICON_FILES.filter(x => path.basename(x).startsWith(prefix)))
}

export const LOG_FILE = `${LOG_DIR}/${+new Date()}.log`;

export type TaskInfo = {
    lastRunTimeStart: Date,
    lastRunTimeEnd: Date,
    lastScheduleTime: Date,
}

export type TaskResult = {
    type: 'success',
    data: any
} | {
    type: 'failed',
    data: any,
} | {
    type: 'skip',
    data: any
}

export type Task = {
    name: string,
    filePath: string,
    task: () => TaskResult | Promise<TaskResult>,
}


let logStream: WriteStream | NodeJS.WritableStream | undefined
let console_: Console

export function mkLogger(name: string) {
    if (!logStream) {
        logStream = createWriteStream(LOG_FILE);
        console_ = new Console(logStream, logStream, false)
    }
    return {
        log: (msg: string) => {
            console_.log(`[${new Date().$let(yyyyMMDDHHmmss)}] [${name}] ${msg}`)
        },
        error: (msg: string) => {
            console_.error(`[${new Date().$let(yyyyMMDDHHmmss)}] [${name}] ${msg}`)
        }
    }
}


export type Logger = typeof mkLogger extends (..._: any) => infer A ? A : never