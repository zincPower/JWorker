import worker, { MessageEvents } from '@ohos.worker'
import { Log } from './log/Log'
import { Envelope, Message } from './Message'
import { MethodCallHandler, Reply } from './Type'

const TAG = "JWorker"

export class JWorker {
  private workerPath: string
  private worker: worker.ThreadWorker | undefined
  private nextReplyId = 1
  private pendingReplies = new Map<number, Reply>()
  private methodCallHandlers = new Map<string, MethodCallHandler>()

  // TODO 超时
  /**
   * @param workerPath worker 路径
   */
  constructor(workerPath: string) {
    this.workerPath = workerPath
  }

  /**
   * 启动 Worker
   */
  init() {
    Log.i(TAG, `【init】workerPath=${this.workerPath}`)
    try {
      this.worker = new worker.ThreadWorker(this.workerPath)
    } catch (e) {
      Log.e(TAG, `【init】worker 创建失败 e=${e}`)
    }
    this.worker.onmessage = (event: MessageEvents) => {
      Log.e(TAG, `【onmessage】主 Worker 接收消息 event=${event}`)
      const envelope = event.data as Envelope
      this.handleMessage(envelope)
    }
    this.worker.onmessageerror = (error) => {
      Log.e(TAG, `【onmessageerror】主 Worker 错误消息 error=${error}`)
    }
    this.worker.onerror = (error) => {
      Log.e(TAG, `【onerror】主 Worker 发生错误 error=${error}`)
    }
  }

  /**
   * 释放 Worker
   */
  release() {
    Log.i(TAG, `【release】`)
    // TODO 关闭由自线程关闭
    this.worker?.terminate()
    this.worker = undefined
  }

  /**
   * 设置处理器
   * @param channelName 渠道名字
   * @param handler 处理方法
   */
  setMethodCallHandler(channelName: string, handler: MethodCallHandler) {
    this.methodCallHandlers.set(channelName, handler)
  }

  /**
   * 发送消息
   * @param message 消息
   * @param reply 回调
   * @param transfer 需要交给子 worker 的 array buffer
   */
  send(message: Message, reply: Reply, transfer?: ArrayBuffer[]) {
    const replyId = this.nextReplyId++
    this.pendingReplies.set(replyId, reply)
    const envelope = new Envelope(replyId, message)
    this.worker?.postMessage(envelope, transfer ?? [])
    Log.i(TAG, `【send】envelope=${envelope}`)
  }

  private async handleMessage(envelope: Envelope) {
    Log.i(TAG, `【handleMessage】envelope=${envelope}`)
    let isReplied = false
    for (const [replyId, reply] of this.pendingReplies) {
      if (replyId == envelope.responseId) {
        Log.i(TAG, `【handleMessage】子 worker 处理完，回复 replyId=${replyId} envelope=${envelope}`)
        reply(envelope.message.data)
        isReplied = true
        break
      }
    }
    if (isReplied) {
      this.pendingReplies.delete(envelope.responseId)
    } else {
      const handler = this.methodCallHandlers.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】接收到子 worker 处理 handler=${handler} envelope=${envelope}`)
      const result = handler == null ? null : await handler(envelope.message.methodName, envelope.message.data)
      const message = new Message(envelope.message.channelName, envelope.message.methodName, result)
      const response = new Envelope(envelope.responseId, message)
      this.worker?.postMessage(response)
    }
  }
}