import { MessageEvents, ThreadWorkerGlobalScope, worker } from "@kit.ArkTS"
import { subWorkerHandler } from "./SubWorkerHandler"
import { Log } from "./log/Log"
import { Envelope } from "./Data"

const TAG = "JWorkerExt"

/**
 * 子 Worker 接口，在子 Worker 中使用
 */
export interface SubWorker {
  /**
   * 关闭子 Worker
   */
  close()
}

/**
 * 在子 Worker 中进行 init 子 Worker
 * @returns 返回子 Worker 实例
 */
export function initJWorker(): SubWorker {
  Log.i(TAG, `【initJWorker】子 Worker 启动`)
  const workerPort = worker.workerPort
  subWorkerHandler.worker = workerPort

  workerPort.onmessage = (event: MessageEvents) => {
    Log.i(TAG, `【onmessage】父 Worker ---消息到达---> 子 Worker event=${JSON.stringify(event)}`)
    const envelope = event.data as Envelope
    subWorkerHandler.handleMessage(workerPort, envelope)
  }

  workerPort.onmessageerror = (error) => {
    Log.e(TAG, `【onmessageerror】子 Worker 错误消息 error=${error}`)
  }

  workerPort.onerror = (error) => {
    Log.e(TAG, `【onerror】子 Worker 发生错误 error=${error}`)
  }

  return new SubWorkerImpl(workerPort)
}

class SubWorkerImpl implements SubWorker {
  private worker: ThreadWorkerGlobalScope

  constructor(worker: ThreadWorkerGlobalScope) {
    this.worker = worker
  }

  close(): void {
    Log.i(TAG, `【close】关闭子 Worker`)
    subWorkerHandler.isRunning = false
    this.worker.close()
  }
}