import { notify } from "node-notifier";
import { Logger, TaskInfo, TaskResult, mkLogger } from "./Constants";
import * as cron from 'cron';
import * as yki from './yki'
export type IntervalTask = {
    taskName: string,
    taskBody: () => Promise<TaskResult>}

export function mkTask<State>(
    taskName: string,
    init: (logger: Logger) => State | Promise<State>,
    p: (logger: Logger, state: State) => boolean | Promise<boolean>,
    body: (logger: Logger, state: State) => [TaskResult, State?] | Promise<[TaskResult, State?]>
): IntervalTask {

    let state: State | null = null
    const logger = mkLogger(taskName)

    let lastError: any | null

    return {
        taskName,
        taskBody: async () => {
            try {
                if (lastError) {
                    return {
                        type: 'skip', data: null
                    }
                }
                if (!state) {
                    state = await init(logger)
                    return {
                        type: 'skip', data: null
                    }
                }

                if (!(await p(logger, state))) {
                    return {
                        type: 'skip', data: null
                    }
                }
                const body_ = await body(logger, state);
                if (!body_) {
                    return {
                        type: 'skip', data: null
                    }
                }
                const [result, neoState] = body_;
                neoState && (state = neoState);
                return result as TaskResult
            } catch (e) {
                lastError = e
                notify({
                    title: `${taskName} throws Exception`,
                    message: e instanceof Error ? `${e.name}: ${e.message}`: `${e}`
                })
                logger.error(`[STOP] fatal error, stop me`)
                throw e
            }
        }}

}


export function mkCronTask<State>(
    taskName: string,
    cronExpr: string, 
    init: (logger: Logger) => State | Promise<State>,
    body: (logger: Logger, state: State) => [TaskResult, State?] | Promise<[TaskResult, State?]>
): IntervalTask {
    // assert cronExpr is valid
    cron.sendAt(cronExpr)

    let nextScheduleTime = new Date(0)
    return mkTask(
        taskName,
        logger => {
            nextScheduleTime = cron.sendAt(cronExpr).toJSDate()
            logger.log(`cron task inited, cron: ${cronExpr}, nextScheduleTime: ${yki.yyyyMMDDHHmmss(nextScheduleTime)}`)
            return init(logger)
        },
        (logger) => {
            if (+new Date() > +nextScheduleTime) {
                nextScheduleTime = cron.sendAt(cronExpr).toJSDate()
                logger.log(`scheduled, cron: ${cronExpr}, nextScheduleTime: ${yki.yyyyMMDDHHmmss(nextScheduleTime)}`)
                return true
            }
            return false
        },
        body
    )
}