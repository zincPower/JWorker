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
  start()

  /**
   * 释放 Worker
   */
  release()

  /**
   * 添加通讯 channel
   * @param channelName 渠道名称
   * @param channel 渠道处理类
   */
  addChannel(channelName: string, channel: Channel)

  /**
   * 移除通讯 channel
   * @param channelName 渠道名称
   */
  removeChannel(channelName: string)
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

  start() {
    if (this.worker != undefined) {
      Log.e(TAG, `【start】JWorker 已经启动了 workerPath=${this.workerPath}`)
      return
    }
    Log.i(TAG, `【start】启动 JWorker workerPath=${this.workerPath}`)
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
        Log.i(TAG, `【onexit】父 Worker 退出 code=${code}`)
        this.clearReply()
        this.worker = undefined
      }
    } catch (e) {
      Log.e(TAG, `【start】JWorker 创建失败 workerPath=${this.workerPath} e=${e}`)
      this.clearReply()
      this.worker = undefined
    }
  }

  release() {
    Log.i(TAG, `【release】JWorker 在主 Worker 进行释放`)
    this.worker?.terminate()
    this.worker = undefined
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

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[]) {
    if (this.worker == undefined) {
      Log.e(TAG, "【send】无法进行正常通讯")
      reply(undefined)
    } else {
      const replyId = this.nextReplyId++
      this.pendingReplies.set(replyId, reply)
      const envelope = new Envelope(replyId, message)
      this.worker.postMessage(envelope, transfer ?? [])
      Log.i(TAG, `【send】父 Worker ----发送----> 子 Worker envelope=${JSON.stringify(envelope)}`)
    }
  }

  private async handleMessage(envelope: Envelope) {
    if (envelope.responseId >= 1) {
      const reply = this.pendingReplies.get(envelope.responseId)
      Log.i(TAG, `【handleMessage】子 Worker ----回复----> 父 Worker envelope=${JSON.stringify(envelope)} reply=${reply}`)
      if (reply != undefined) {
        reply(envelope.message.data)
        this.pendingReplies.delete(envelope.responseId)
      }
    } else {
      const channel = this.channels.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】子 Worker ----调用----> 父 worker channel=${channel} envelope=${JSON.stringify(envelope)}`)
      const result = channel == undefined ? undefined : await channel.handleMessage(envelope.message.methodName, envelope.message.data)
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