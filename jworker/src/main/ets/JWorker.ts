import worker from '@ohos.worker'
import { Channel } from './Channel'
import { Envelope, Message, Reply, TransferData } from './Data'
import { Log } from './Log'

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
   * 添加通讯 channel
   * @param channelName channel 名称
   * @param channel 渠道处理类
   */
  addChannel(channelName: string, channel: Channel)

  /**
   * 移除通讯 channel
   * @param channelName
   */
  removeChannel(channelName: string)
}

/**
 * 信使接口，实现接口的类说明有以下能力：
 * 1、能够设置渠道处理器
 * 2、能够发送消息
 */
export interface Messenger {
  setMethodCallHandler(channelName: string, channel: Channel)

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[])
}

class JWorkerImpl implements JWorker {
  private workerPath: string
  private worker: worker.ThreadWorker | undefined
  private nextReplyId = 1
  private pendingReplies = new Map<number, Reply>()
  private channels = new Map<string, Channel>()

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
    this.worker?.terminate()
    this.worker = undefined
  }

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[]) {
    const replyId = this.nextReplyId++
    this.pendingReplies.set(replyId, reply)
    const envelope = new Envelope(replyId, message)
    this.worker?.postMessage(envelope, transfer ?? [])
    Log.i(TAG, `【send】父 Worker ----发送----> 子 Worker envelope=${JSON.stringify(envelope)}`)
  }

  addChannel(channelName: string, channel: Channel) {
    Log.i(TAG, `【addChannel】添加通讯 channel channelName=${channelName}`)
    channel.send = (methodName: string, data?: any, transfer?: ArrayBuffer[]) => {
      Log.i(TAG, `【send】父 Worker ----发送----> 子 worker methodName=${methodName} data=${JSON.stringify(data)}`)
      const message = new Message(channelName, methodName, data)
      return new Promise((resolve: Function, reject: Function) => {
        try {
          this.send(message, (result: any) => resolve(result), transfer)
        } catch (error) {
          reject(error)
        }
      })
    }
    this.channels.set(channelName, channel)
  }

  removeChannel(channelName: string): void {
    this.channels.delete(channelName)
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
      const handler = this.channels.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】父 Worker ----处理----> 子 worker handler=${handler} envelope=${envelope}`)
      const result = handler == null ? null : await handler.handleMessage(envelope.message.methodName, envelope.message.data)
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