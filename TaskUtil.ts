import { notify } from "node-notifier";
import { Logger, TaskInfo, TaskResult, mkLogger } from "./Constants";


export function mkTask<State>(
    taskName: string,
    init: (logger: Logger) => State | Promise<State>,
    p: (logger: Logger, state: State) => boolean | Promise<boolean>,
    body: (logger: Logger, state: State) => [TaskResult, State?] | Promise<[TaskResult, State?]>
): {
    taskName: string,
    taskBody: () => Promise<TaskResult>} {

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
                logger.log('start running')
                const [result, neoState] = await body(logger, state);
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
