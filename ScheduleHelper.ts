import { readFileSync } from "fs";
import { PID_FILE } from "./Constants";
import { exec, execSync, spawn, spawnSync } from "child_process";
import { join } from "path";
import net from 'net'
// import spawn from  'cross-spawn'

function isPortTaken(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const tester = net.createServer()
            .once('error', (err) => {
                if ((err as any).code === 'EADDRINUSE') {
                    resolve(true); // 端口被占用
                } else {
                    resolve(true); // 其他错误
                }
            })
            .once('listening', () => {
                tester.once('close', () => resolve(false)).close();
            })
            .listen(port);
    });
};

async function lastPid(): Promise<number | null> {
    try {
        const pid = readFileSync(PID_FILE, 'utf-8').trim()
        const alive = await isPortTaken(+pid)
        return alive ? +pid : null;
    } catch(e) {
        return null
    }
}

function start() {
    const child = spawn('node', [`${join(__dirname, 'Scheduler.js').replace(/\\/g, '/')}`], { 
       detached: true, stdio: 'ignore' })
    child.unref()
}

async function stop() {
    const pid = await lastPid()
    try {
        console.log(`fetch http://localhost:${pid}/stop`)
        pid && await fetch(`http://localhost:${pid}/stop`)
    } catch (e) {}
}

const ARG_TO_OPT = {
    start: async () => {
        if (await lastPid()) {
            console.error('already running')
            process.exit(1)
        }
        start()
    },
    stop: async () => {
        if (!await lastPid()) {
            console.error('not running')
            process.exit(1)
        }
        await stop()
    },
    restart: async () => {
        if (await lastPid()) {
            await stop()
        }
        start()
    },
    status: async () => {
        console.log(await lastPid() ? 'active' : 'dead')
        console.log(await (((await fetch(`http://localhost:${await lastPid()}/status`))).text()))
    }
} as Record<string, () => Promise<void>>

if (!ARG_TO_OPT[process.argv[2]]) {
    console.error(`valid arguments: ${Object.keys(ARG_TO_OPT).join(', ')}`)
    process.exit(1)
}

ARG_TO_OPT[process.argv[2]]()