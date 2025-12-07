import { ThreadWorkerGlobalScope } from '@ohos.worker'
import { Channel } from './Channel'
import { Envelope, Message, Reply, TransferData } from './Data'
import { Log } from './Log'

const TAG = "SubWorkerHandler"

class SubWorkerHandler {
  private worker: ThreadWorkerGlobalScope | undefined
  private isRunning = true
  private channels = new Map<string, Channel>()
  private nextReplyId = -1
  private pendingReplies = new Map<number, Reply>()

  setWorker(worker: ThreadWorkerGlobalScope) {
    this.worker = worker
  }

  addChannel(channelName: string, channel: Channel) {
    this.channels.set(channelName, channel)
  }

  async handleMessage(worker: ThreadWorkerGlobalScope, envelope: Envelope) {
    if (envelope.responseId <= -1) {
      const reply = this.pendingReplies.get(envelope.responseId)
      Log.i(TAG, `【handleMessage】子 worker ----回复----> 父 Worker envelope=${envelope} reply=${reply}`)
      if (reply != undefined) {
        reply(envelope.message.data)
        this.pendingReplies.delete(envelope.responseId)
      }
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

  send(message: Message, reply: Reply, transfer?: ArrayBuffer[]) {
    if (this.isRunning && this.worker != undefined) {
      const replyId = this.nextReplyId--
      this.pendingReplies.set(replyId, reply)
      const envelope = new Envelope(replyId, message)
      this.worker.postMessage(envelope, transfer ?? [])
      Log.i(TAG, `【send】子 Worker ----发送----> 父 Worker envelope=${JSON.stringify(envelope)}`)
    } else {
      Log.e(TAG, `【send】无法进行通讯 isRunning=${this.isRunning} worker=${this.worker}`)
      reply(undefined)
    }
  }

  release() {
    this.isRunning = false
    this.worker = undefined
  }
}

export const subWorkerHandler = new SubWorkerHandler()