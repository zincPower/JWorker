import { ThreadWorkerGlobalScope } from '@ohos.worker'
import { Envelope, Message, MethodCallHandler, Reply } from './Data'
import { Log } from './log/Log'

const TAG = "SubWorkerHandler"

class SubWorkerHandler {
  worker: ThreadWorkerGlobalScope
  methodHandlerMap = new Map<string, MethodCallHandler>()
  private nextReplyId = -1
  private pendingReplies = new Map<number, Reply>()

  async handleMessage(worker: ThreadWorkerGlobalScope, envelope: Envelope) {
    let isReplied = false
    for (const [replyId, reply] of this.pendingReplies) {
      if (replyId == envelope.responseId) {
        Log.i(TAG, `【handleMessage】子 worker ----回复----> 主 Worker replyId=${replyId} envelope=${envelope}`)
        reply(envelope.message.data)
        isReplied = true
        break
      }
    }
    if (isReplied) {
      this.pendingReplies.delete(envelope.responseId)
    } else {
      const handler = this.methodHandlerMap.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】子 worker ---处理回复---> 主 worker handler=${handler} envelope=${JSON.stringify(envelope)}`)
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
    Log.i(TAG, `【send】子 Worker ----发送----> 主 Worker envelope=${JSON.stringify(envelope)}`)
  }
}

export const subWorkerHandler = new SubWorkerHandler()