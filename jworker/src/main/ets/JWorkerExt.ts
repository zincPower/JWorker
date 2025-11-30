import { MessageEvents, worker } from "@kit.ArkTS"
import { subWorkerHandler } from "./SubWorkerHandler"
import { Log } from "./log/Log"
import { Envelope } from "./Message"

const TAG = "JWorkerExt"

export function initJWorker() {
  Log.i(TAG, `【initJWorker】子 Worker 启动`)
  const workerPort = worker.workerPort
  subWorkerHandler.worker = workerPort

  workerPort.onmessage = (event: MessageEvents) => {
    Log.i(TAG, `【onmessage】子 Worker 接收消息 event=${event}`)
    const envelope = event.data as Envelope
    subWorkerHandler.handleMessage(workerPort, envelope)
  }

  workerPort.onmessageerror = (error) => {
    Log.i(TAG, `【onmessageerror】子 Worker 错误消息 error=${error}`)
  }

  workerPort.onerror = (error) => {
    Log.i(TAG, `【onerror】子 Worker 发生错误 error=${error}`)
  }
}