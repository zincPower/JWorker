import worker from '@ohos.worker'
import { Channel } from './Channel'
import { ParentWorkerChannel } from './channel/ParentWorkerChannel'
import { Envelope, Message, MethodCallHandler, Reply, TransferData } from './Data'
import { Log } from './log/Log'

const TAG = "JWorker"

/**
 * 创建 JWorker
 * @param workerPath worker 路径
 * @returns JWorker 的使用实例
 */
export function createJWorker(workerPath: string): JWorker {
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
  createChannel(channelName: string): Channel
}

/**
 * 信使接口，实现接口的类说明有以下能力：
 * 1、能够设置渠道处理器
 * 2、能够发送消息
 */
export interface Messenger {
  setMethodCallHandler(channelName: string, handler: MethodCallHandler)

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[])
}

class JWorkerImpl implements JWorker, Messenger {
  private workerPath: string
  private worker: worker.ThreadWorker | undefined
  private nextReplyId = 1
  // TODO 需要清理，在关闭了后
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
      this.worker.onmessage = (event) => {
        Log.i(TAG, `【onmessage】子 Worker ---消息到达---> 父 Worker event=${JSON.stringify(event)}`)
        this.handleMessage(event.data as Envelope)
      }
      this.worker.onmessageerror = (error) => {
        Log.e(TAG, `【onmessageerror】父 Worker 错误消息 error=${error}`)
      }
      this.worker.onerror = (error) => {
        Log.e(TAG, `【onerror】父 Worker 发生错误 error=${error}`)
      }
      this.worker.onexit = (code) => {
        Log.i(TAG, `【onerror】父 Worker 退出 code=${code}`)
        this.clearReply()
        this.worker = undefined
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
    Log.i(TAG, `【setMethodCallHandler】父 Worker 设置 channel 处理器 channelName=${channelName} handler=${handler}`)
    this.methodCallHandlers.set(channelName, handler)
  }

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[]) {
    const replyId = this.nextReplyId++
    this.pendingReplies.set(replyId, reply)
    const envelope = new Envelope(replyId, message)
    this.worker?.postMessage(envelope, transfer ?? [])
    Log.i(TAG, `【send】父 Worker ----发送----> 子 Worker envelope=${JSON.stringify(envelope)}`)
  }

  createChannel(channelName: string): Channel {
    Log.i(TAG, `【createChannel】创建通讯 channel channelName=${channelName}`)
    return new ParentWorkerChannel(channelName, this)
  }

  private async handleMessage(envelope: Envelope) {
    let isReplied = false
    for (const [replyId, reply] of this.pendingReplies) {
      if (replyId == envelope.responseId) {
        Log.i(TAG, `【handleMessage】父 Worker ----回复----> 子 Worker replyId=${replyId} envelope=${JSON.stringify(envelope)}`)
        reply(envelope.message.data)
        isReplied = true
        break
      }
    }
    if (isReplied) {
      this.pendingReplies.delete(envelope.responseId)
    } else {
      const handler = this.methodCallHandlers.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】父 Worker ----处理----> 子 worker handler=${handler} envelope=${envelope}`)
      const result = handler == null ? null : await handler(envelope.message.methodName, envelope.message.data)
      let transfer: ArrayBuffer[] = []
      let data = result
      if (result instanceof TransferData) {
        transfer = result.transfer
        data = result.data
      }
      const message = new Message(envelope.message.channelName, envelope.message.methodName, data)
      const response = new Envelope(envelope.responseId, message)
      this.worker?.postMessage(response, transfer)
    }
  }

  private clearReply() {
    // 让在等待的 Reply 都有回复，释放掉挂起点
    this.pendingReplies.forEach((reply) => {
      reply(undefined)
    })
    this.pendingReplies.clear()
  }
}