import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { PID_FILE, TASK_DIR, TASK_INTERVAL, Task, mkLogger } from "./Constants";
import notifier from 'node-notifier'
import http from 'http'
const logger = mkLogger('SCHEDULER')
logger.log('nihao')

const randomPort = () => {
  return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
};

function getTasks() {
  const taskFiles = readdirSync(TASK_DIR)

  if (taskFiles.length === 0) {
    return []
  }
  const tasks: Task[] = taskFiles.flatMap(name => {
    const filePath = join(TASK_DIR, name)
    let task;
    try {
      task = require(filePath)
    } catch (error) {
      logger.error(`${filePath} require failed!`)
      if (error instanceof Error) {
        logger.error(`${error.message}`)
        logger.error(`${error.stack}`)
      } else {
        logger.error(`${error}`)
      }
      return []
    }
    return [{
      name: task.taskName ?? name.split('.')[0],
      filePath,
      task: task.taskBody,
    }]
  })
  logger.log('registered tasks: ')
  tasks.forEach(({ filePath, name }) => logger.log(`${filePath}: ${name}`))
  return tasks
}

async function work() {
  const tasks = getTasks()

  let timeoutId: number | null = null
  function loop() {
    timeoutId = setTimeout(async () => {
      for (const task of tasks) {
        try {
          const result = await task.task()
          if (result.type === 'skip') {
            continue
          } else if (result.type === 'success') {
            logger.log(`[SUCCESS] ${task.name} execute sucessfully. result: '${result.data}'`)
          } else {
            logger.error(`[FAIL] ${task.name} execute failed. result: '${result.data}'`)
          }
        } catch (error) {
          logger.error(`[FATAL] ${task.name} execute fatal`)
          if (error instanceof Error) {
            logger.error(`${error.message}`)
            logger.error(`${error.stack}`)
          } else {
            logger.error(`${error}`)
          }
        }
      }
      loop()
    }, TASK_INTERVAL) as unknown as number
  }
  loop()

  process.on('beforeExit', () => new Promise(resolve => {
    (timeoutId && clearTimeout(timeoutId));
    logger.log('STOPPED');
    notifier.notify({
      title: '掰掰',
      message: 'Scheduler 已退出',
    }, () => {
      resolve(1)
    })
  }))

  const server = http.createServer((req, res) => {
    if (req.url === '/stop') {
      (timeoutId && clearTimeout(timeoutId));
      logger.log('STOPPED');
      notifier.notify({
        title: '掰掰',
        message: 'Scheduler 已退出',
        time: 1000,
      }, () => {
        process.exit(0);
      })
    } else if (req.url === '/status') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({
        tasks: tasks.map(task => ({ taskName: task.name, path: task.filePath }))
      }))
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  // 随机监听一个端口
  const port = randomPort();
  server.listen(port, () => {
    logger.log(`Server listening on port ${port}`);
    writeFileSync(PID_FILE, port.toString())
  });
}

work()

