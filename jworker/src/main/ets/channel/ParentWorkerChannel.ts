import { Channel } from "../Channel"
import { Message, MethodCallHandler } from "../Data"
import { Messenger } from "../JWorker"
import { Log } from "../log/Log"

const TAG = "ParentWorkerChannel"

export class ParentWorkerChannel implements Channel {
  private channelName: string
  private messenger: Messenger

  constructor(channelName: string, messenger: Messenger) {
    this.channelName = channelName
    this.messenger = messenger
  }

  setMethodCallHandler(handler: MethodCallHandler) {
    Log.i(TAG, `【setMethodCallHandler】父 Worker 设置方法处理 channelName=${this.channelName} handler=${handler}`)
    this.messenger.setMethodCallHandler(this.channelName, handler)
  }

  send(methodName: string, data?: any, transfer?: ArrayBuffer[]): Promise<any> {
    Log.i(TAG, `【send】父 Worker ----发送----> 子 worker methodName=${methodName} data=${JSON.stringify(data)}`)
    const message = new Message(this.channelName, methodName, data)
    return new Promise((resolve: Function, reject: Function) => {
      try {
        this.messenger.send(message, (result: any) => resolve(result), transfer)
      } catch (error) {
        reject(error)
      }
    })
  }
}