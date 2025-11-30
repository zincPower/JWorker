import worker, { MessageEvents } from '@ohos.worker'
import { ClientChannel } from './ClientChannel'
import { Envelope, Message, MethodCallHandler, Reply } from './Data'
import { Log } from './log/Log'

const TAG = "JWorker"

export function JWorker(workerPath: string): JWorker {
  return new JWorkerImpl(workerPath)
}

export interface JWorker {
  /**
   * 启动 Worker
   */
  init()

  /**
   * 释放 Worker
   */
  release()

  /**
   * 创建通讯 channel
   * @param channelName channel 名称
   */
  createChannel(channelName: string): ClientChannel
}

export interface Messenger {
  setMethodCallHandler(channelName: string, handler: MethodCallHandler)

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[])
}

class JWorkerImpl implements JWorker, Messenger {
  private workerPath: string
  private worker: worker.ThreadWorker | undefined
  private nextReplyId = 1
  private pendingReplies = new Map<number, Reply>()
  private methodCallHandlers = new Map<string, MethodCallHandler>()

  constructor(workerPath: string) {
    this.workerPath = workerPath
    Log.i(TAG, `【constructor】构造 workerPath=${workerPath}`)
  }

  init() {
    Log.i(TAG, `【init】启动 JWorker workerPath=${this.workerPath}`)
    try {
      this.worker = new worker.ThreadWorker(this.workerPath)
      this.worker.onmessage = (event: MessageEvents) => {
        Log.i(TAG, `【onmessage】子 Worker ---消息到达---> 主 Worker event=${JSON.stringify(event)}`)
        this.handleMessage(event.data as Envelope)
      }
      this.worker.onmessageerror = (error) => {
        Log.e(TAG, `【onmessageerror】主 Worker 错误消息 error=${error}`)
      }
      this.worker.onerror = (error) => {
        Log.e(TAG, `【onerror】主 Worker 发生错误 error=${error}`)
      }
    } catch (e) {
      Log.e(TAG, `【init】worker 创建失败 e=${e}`)
    }
  }

  release() {
    Log.i(TAG, `【release】`)
    // TODO 关闭由子线程关闭
    this.worker?.terminate()
    this.worker = undefined
  }

  setMethodCallHandler(channelName: string, handler: MethodCallHandler) {
    Log.i(TAG, `【setMethodCallHandler】主 worker 设置 channel 处理器 channelName=${channelName} handler=${handler}`)
    this.methodCallHandlers.set(channelName, handler)
  }

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[]) {
    const replyId = this.nextReplyId++
    this.pendingReplies.set(replyId, reply)
    const envelope = new Envelope(replyId, message)
    this.worker?.postMessage(envelope, transfer ?? [])
    Log.i(TAG, `【send】主 Worker ----发送----> 子 Worker envelope=${JSON.stringify(envelope)}`)
  }

  createChannel(channelName: string): ClientChannel {
    Log.i(TAG, `【createChannel】创建通讯 channel channelName=${channelName}`)
    return new ClientChannel(channelName, this)
  }

  private async handleMessage(envelope: Envelope) {
    let isReplied = false
    for (const [replyId, reply] of this.pendingReplies) {
      if (replyId == envelope.responseId) {
        Log.i(TAG, `【handleMessage】主 worker ----回复----> 子 Worker replyId=${replyId} envelope=${JSON.stringify(envelope)}`)
        reply(envelope.message.data)
        isReplied = true
        break
      }
    }
    if (isReplied) {
      this.pendingReplies.delete(envelope.responseId)
    } else {
      const handler = this.methodCallHandlers.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】主 worker ----处理----> 子 worker handler=${handler} envelope=${envelope}`)
      const result = handler == null ? null : await handler(envelope.message.methodName, envelope.message.data)
      const message = new Message(envelope.message.channelName, envelope.message.methodName, result)
      const response = new Envelope(envelope.responseId, message)
      this.worker?.postMessage(response)
    }
  }
}