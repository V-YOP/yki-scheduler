const notifier = require('node-notifier')
const { mkTask } = require('../dist/TaskUtil')
const yki = require('../dist/yki')
const { PIC_SAVE_PATH, BASE_PATH } = require('../dist/Constants')
const { spawn, execSync } = require('child_process')
const path = require('path')
const { writeFile, readdir, cp } = require('fs/promises')
const { title } = require('process')
const { readdirSync } = require('fs')
const { mkClipboard } = require('../dist/Clipboard')
const { homedir } = require('os')
const { toggleTheme } = require('../dist/Util')

/** @typedef {import('../dist/Constants').Logger} Logger */
/** @typedef {import('../dist/Clipboard').Clipboard} Clipboard */

/** @type Logger */
let logger


/**
 * @type {() => Promise<void>}
 */
async function onImage() {
  const histrories = clipboard.histories()
  const data = histrories[0]
  const filePath = `${PIC_SAVE_PATH}/${+new Date()}.png`
  const imgBuffer = data.data
  await writeFile(filePath, imgBuffer)
  notifier.notify({
    title: 'picture saved',
    message: filePath,
    sound: false,
    icon: filePath,
    time: 1500,
  }, (e, r, m) => {
    if (r === 'activate') {
      execSync(`start ${PIC_SAVE_PATH}`)
    }
  })
}

/**
 * @type {() => Promise<void>}
 */
async function onCommand() {
  const histrories = clipboard.histories()
  const data = histrories[0]
  if (data.type !== 'TEXT') {
    throw new Error('Impossible')
  }
  const s = data.data.trim().split(/\r?\n/)
  const [cmdStr, ...textStr] = s
  const cmd = cmdStr.replace('##', '').replace('---', '').replace('///', '').trim()

  let text = ''
  if (textStr.length === 0) {
    logger.log(`cmd: ${cmd}, no text`)
    text = ''
  } else {
    text = textStr.join('\n').trim() 
    logger.log(`cmd: ${cmd}, text: ${text}`)
  }

  if (cmd.toUpperCase() === 'PING') {
    notifier.notify({
      title: 'PONG',
      message: text === '' ? 'NO CONTENT' : text,
    })
  } else if (cmd.toUpperCase() === 'KRASTAT') {
    execSync(`node ${homedir}/.kra_history/neo-kra-stat`)
  } else if (cmd.toUpperCase() === 'TMP') {
    execSync(`start D:/DESKTOP/TMP`)
  } else if (cmd.toUpperCase() === 'TOTMP') {
    const histrories = clipboard.histories()
    if (histrories.length === 0 || histrories[1].type !== 'FILE_LIST') {
      notifier.notify({
        title: 'to tmp',
        message: 'last clipboard data not file list'
      })
      return
    }
    const fileList = histrories[1].data 
    if (fileList.map(x=>x.replace(/\\/g, '/')).some(x=>x.startsWith('D:/DESKTOP/TMP/'))) {
      notifier.notify({
        title: 'to tmp',
        message: 'skip'
      })
      return
    }
    
    const names = await Promise.all(fileList.map(async filePath => {
      const name = path.basename(filePath)
      await cp(filePath, `D:/DESKTOP/TMP/${name}`, {force: true, recursive: true})
      return name
    }))
    notifier.notify({
      title: 'to tmp',
      message: names.filter(x=>x).join(', ')
    }, (e, r)  => {
      if (r === 'activate') {
        execSync(`start D:/DESKTOP/TMP`)
      }
    })
  } else if (cmd.toUpperCase() === 'THEME') {
    toggleTheme()
  }
}

/**
 * @type {() => Promise<void>}
 */
async function onText() {
  // do nothing
}

/**
 * @type {() => Promise<void>}
 */
async function onFileList() {
  // do nothing
}

/**
 * @type {(s: string) => boolean}
 */
function containsCmd(s) {
  s = s.trimStart()
  return s.startsWith('---') || s.startsWith('##') || s.startsWith('///')
}

const clipboard = mkClipboard(10)

module.exports = mkTask(
  '剪切板监听',
  async logger_ => {
    logger = logger_
    logger_.log('init')
    return {
      lastExecuteTime: new Date(),
      lastMd5: -1,
      lastSeqId: -1,
    }
  },

  (logger, state) => {
    return +new Date() - +state.lastExecuteTime > 300
  },

  async (logger, state) => {
    state.lastExecuteTime = new Date()
    const startTime = +new Date()
    const data = await clipboard.read()
    const endTime = +new Date()
    if (state.lastMd5 === data.md5 || data.seq_id === -1) {
      return 
    }

    logger.log(`Clipboard changed: ${data.md5}:${data.type}, parseTime: ${endTime - startTime} ms`)
    // if (data.type === 'TEXT' || data.type === 'FILE_LIST') {
    //   logger.log(`Clipboard content: ${data.data}`)
    // }

    if (data.type === 'IMAGE') {
      await onImage()
    } else if (data.type === 'FILE_LIST') {
      await onFileList()
    } else if (data.type === 'TEXT') {
      if (containsCmd(data.data)) {
        await onCommand()
      } else {
        await onText()
      }
    } else {
      // do nothing
    }

    state.lastMd5 = data.md5
    state.lastSeqId = data.seq_id
    return [{
      type: 'success', data: 'done'
    }]
  }
)
