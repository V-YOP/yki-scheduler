const notifier = require('node-notifier')
const { mkTask } = require('../dist/TaskUtil')
const yki = require('../dist/yki')
const { PIC_SAVE_PATH, BASE_PATH } = require('../dist/Constants')
const { spawn } = require('child_process')
const path = require('path')
const { writeFile } = require('fs/promises')
/** @type {import('../dist/Constants').Logger} */
let logger

/**
 * @typedef {{
 *   type: 'TEXT',
 *   data: string,
 *   md5: string,
 * } | {
 *   type: 'IMAGE',
 *   data: string,
 *   md5: string,
 * } | {
 *   type: 'FILE_LIST',
 *   data: string[],
 *   md5: string,
 * } | {
 *   type: 'UNKNOWN'
 * }} Clipboard
 */

/** @type {() => Promise<Clipboard>} */
function readClipboard() {
  return new Promise(resolve => {
    const cp = spawn('python', [path.resolve(BASE_PATH, 'dumpClipboard.py')], { shell: false, detached: true, windowsHide: true })

    let combinedOutput = ''; // 用于保存组合后的输出
    cp.stdout.on('data', data => {
      combinedOutput += data.toString()
    })
    cp.on('close', code => {
      if (code !== 0) {
        resolve({ type: 'UNKNOWN' })
        return
      }
      try {
        resolve(JSON.parse(combinedOutput))
      } catch (e) {
        resolve({ type: 'UNKNOWN' })
      }
    })
  })
}

/** @type {(img: Clipboard) => Promise<[number, number]>} */
async function saveImage(img) {
  if (img.type !== 'IMAGE') {
    throw new Error('Impossible')
  }

  const {data, md5} = img
  const time0 = +new Date()
  const imgBuffer = Buffer.from(data, 'base64')

  const time1 = +new Date()
  const resultPath = path.resolve(PIC_SAVE_PATH, `${md5}.png`)
  await new Promise(resolve => {
    const cp = spawn('magick', ['convert', '-', resultPath], { shell: false, detached: true, windowsHide: true })
    cp.on('close', () => {
      resolve()
    })
    cp.stdin?.write(imgBuffer)
    cp.stdin?.end()
  })
  await writeFile(path.resolve(PIC_SAVE_PATH, `${md5}.bmp`), imgBuffer)

  const time2 = +new Date()
  return [time1 - time0, time2 - time1]
}

module.exports = mkTask(
  '剪切板监听',
  logger_ => {
    logger = logger_
    logger.log('init')
    return {
      lastExecuteTime: new Date(),
      lastMd5s: new Set([-1]),
    }
  },

  (logger, state) => {
    return state.lastExecuteTime.getSeconds() !== new Date().getSeconds()
  },

  async (logger, state) => {
    state.lastExecuteTime = new Date()
    const startTime = +new Date()
    const clipboard = await readClipboard()
    const endTime = +new Date()
    if (state.lastMd5s.has(clipboard.md5)) {
      return 
    }

    logger.log(`Clipboard changed: ${clipboard.md5}:${clipboard.type}, parseTime: ${endTime - startTime} ms`)
    if (clipboard.type === 'TEXT' || clipboard.type === 'FILE_LIST') {
      logger.log(`Clipboard content: ${clipboard.data}`)
    }

    if (clipboard.type === 'IMAGE') {
      logger.log(`start writing picture from clipboard...`)
      const [readBase64Time, writeFileTime] = await saveImage(clipboard)
      logger.log(`writing picture done. readBase64 cost: ${readBase64Time} ms, parseAndWrite cost: ${writeFileTime} ms`)
    }

    state.lastMd5s.add(clipboard.md5)
    return [{
      type: 'success', data: 'done'
    }]
  }
)
