import { Envelope, Message } from './Message'
import { ThreadWorkerGlobalScope } from '@ohos.worker'
import { Log } from './log/Log'
import { MethodCallHandler, Reply } from './Type'

const TAG = "SubWorkerHandler"

class SubWorkerHandler {
  worker: ThreadWorkerGlobalScope
  methodHandlerMap = new Map<string, MethodCallHandler>()
  private nextReplyId = -1
  private pendingReplies = new Map<number, Reply>()

  async handleMessage(worker: ThreadWorkerGlobalScope, envelope: Envelope) {
    Log.i(TAG, `【handleMessage】envelope=${envelope} methodHandlerMap=${this.methodHandlerMap.size}`)
    let isReplied = false
    for (const [replyId, reply] of this.pendingReplies) {
      if (replyId == envelope.responseId) {
        reply(envelope.message.data)
        isReplied = true
        break
      }
    }
    if (isReplied) {
      this.pendingReplies.delete(envelope.responseId)
    } else {
      const handler = this.methodHandlerMap.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】接收到主 worker 处理 handler=${handler} envelope=${envelope}`)
      const result = handler == null ? null : await handler(envelope.message.methodName, envelope.message.data)
      const message = new Message(envelope.message.channelName, envelope.message.methodName, result)
      const response = new Envelope(envelope.responseId, message)
      worker.postMessage(response)
    }
  }

  send(message: Message, callback: Reply, transfer?: ArrayBuffer[]) {
    const replyId = this.nextReplyId--
    this.pendingReplies.set(replyId, callback)
    const envelope = new Envelope(replyId, message)
    this.worker.postMessage(envelope, transfer ?? [])
    Log.i(TAG, `【send】envelope=${envelope}`)
  }
}

export const subWorkerHandler = new SubWorkerHandler()