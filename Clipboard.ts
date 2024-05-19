import { spawn } from "child_process";
import path from "path";
import { BASE_PATH } from "./Constants";
import { writeFile } from "fs/promises";
import { mkSemaphare } from "./yki";
import { readFileSync } from "fs";

export type ClipboardTextData = {
  type: 'TEXT',
  data: string,
  md5: string,
  seq_id: number,
}

export type ClipboardImageData = {
  type: 'IMAGE',
  /**
   * 图像内容 Buffer
   */
  data: Buffer,   
  md5: string,
  seq_id: number,
}

export type ClipboardFileListData = {
  type: 'FILE_LIST',
  data: string[],
  md5: string,
  seq_id: number,
}

export type ClipboardUnknownData = {
  type: 'UNKNOWN',
  md5: string,
  seq_id: number,
}

type ClipboardDataTuple = [ClipboardTextData, ClipboardImageData, ClipboardFileListData, ClipboardUnknownData]

export type ClipboardData = ClipboardDataTuple[number]

export type Clipboard = {
  historySize: () => number,
  read: (seqId?: number) => Promise<ClipboardData>,
  writeText: (text: string) => Promise<boolean>,
  writeImage: (img: Buffer) => Promise<boolean>
  histories: () => ClipboardData[],
}

export function mkClipboard(historySize: number = 10): Clipboard {
  const histories: ClipboardData[] = []
  function appendHistory(data: ClipboardData) {
    if (histories.length >= historySize) {
      histories.pop()
    }
    histories.unshift(data)
  }
  return {
    historySize: () => historySize,
    read: async (seqId) => {
      const data = await readClipboard(seqId)
      appendHistory(data)
      return data
    },
    writeText: async (text: string) => {
      return new Promise(resolve => {
        const cp = spawn(`python`, [`${BASE_PATH}/writeClipboard.py`, 't'])
        cp.stdout.on('data', (data: Buffer) => {
          const res = data.toString()
          if (res === 'True') {
            resolve(true)
          } else {
            resolve(false)
          }
        })
        cp.stdin.write(Buffer.from(text, 'utf-8'))
        cp.stdin.end()
      })
    },
    writeImage: async (img: Buffer) => {
      return new Promise(resolve => {
        const cp = spawn(`python`, [`${BASE_PATH}/writeClipboard.py`, 'i'])
        let flag: boolean = true
        cp.stdout.on('data', (data: Buffer) => {
          const res = data.toString().trim()
          if (res === 'True') {
            flag = (true)
          } else {
            flag = (false)
          }
        })
        cp.on('close', () => {
          resolve(flag)
        })
        cp.stdin.write(img)
        cp.stdin.end()
      })
    },
    histories: () => [...histories],
  }
}


export async function dibToPng(dibBuffer: Buffer): Promise<Buffer> {
  const buffers: Buffer[] = []
  await new Promise(resolve => {
    const cp = spawn('magick', ['convert', '-', 'PNG:-'], { shell: false, detached: true, windowsHide: true })
    cp.stdout.on('data', (data: Buffer) => {
      buffers.push(data)
    })
    cp.on('close', () => {
      resolve(null)
    })
    cp.stdin.write(dibBuffer, (e) => {
      cp.stdin.end()
    })
  })

  return Buffer.concat(buffers)
}


const mutex = mkSemaphare(1)
async function readClipboardRaw(seqId?: number): Promise<unknown> {
  return new Promise(async resolve => {
    await mutex.wait()
    const cp = spawn('python', [path.resolve(BASE_PATH, 'dumpClipboard.py'), ...(seqId ? [''+seqId] : [])], { shell: false, detached: true, windowsHide: true })

    let combinedOutput = ''; // 用于保存组合后的输出
    cp.stdout.on('data', data => {
      combinedOutput += data.toString()
    })
    cp.on('close', code => {
      mutex.signal()
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

export async function readClipboard(seqId?: number): Promise<ClipboardData> {
  const raw = await readClipboardRaw(seqId)
  const type: ClipboardData['type'] = (raw as any).type
  if (type === 'IMAGE') {
    const data = await dibToPng(Buffer.from((raw as any).data, 'base64'))
    return {
      type: 'IMAGE',
      data,
      md5: (raw as any).md5,
      seq_id: (raw as any).seq_id,
    }
  }
  return raw as ClipboardData
}