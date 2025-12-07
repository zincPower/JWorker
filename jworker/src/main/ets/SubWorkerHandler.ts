import { ThreadWorkerGlobalScope } from '@ohos.worker'
import { Channel } from './Channel'
import { Envelope, Message, Reply, TransferData } from './Data'
import { Log } from './Log'

const TAG = "SubWorkerHandler"

class SubWorkerHandler {
  worker: ThreadWorkerGlobalScope
  isRunning = true
  channels = new Map<string, Channel>()
  private nextReplyId = -1
  private pendingReplies = new Map<number, Reply>()

  async handleMessage(worker: ThreadWorkerGlobalScope, envelope: Envelope) {
    let isReplied = false
    for (const [replyId, reply] of this.pendingReplies) {
      if (replyId == envelope.responseId) {
        Log.i(TAG, `【handleMessage】子 worker ----回复----> 父 Worker replyId=${replyId} envelope=${envelope}`)
        reply(envelope.message.data)
        isReplied = true
        break
      }
    }
    if (isReplied) {
      this.pendingReplies.delete(envelope.responseId)
    } else {
      const handler = this.channels.get(envelope.message.channelName)
      Log.i(TAG, `【handleMessage】子 worker ---处理回复---> 父 Worker handler=${handler} envelope=${JSON.stringify(envelope)}`)
      const result = handler == null ? null : await handler.handleMessage(envelope.message.methodName, envelope.message.data)
      let transfer: ArrayBuffer[] = []
      let data = result
      if (result instanceof TransferData) {
        transfer = result.transfer
        data = result.data
      }
      const message = new Message(envelope.message.channelName, envelope.message.methodName, data)
      const response = new Envelope(envelope.responseId, message)
      if (this.isRunning) {
        worker.postMessage(response, transfer)
      }
    }
  }

  send(message: Message, callback: Reply, transfer?: ArrayBuffer[]) {
    const replyId = this.nextReplyId--
    this.pendingReplies.set(replyId, callback)
    const envelope = new Envelope(replyId, message)
    if (this.isRunning) {
      this.worker.postMessage(envelope, transfer ?? [])
    }
    Log.i(TAG, `【send】子 Worker ----发送----> 父 Worker envelope=${JSON.stringify(envelope)}`)
  }
}

export const subWorkerHandler = new SubWorkerHandler()