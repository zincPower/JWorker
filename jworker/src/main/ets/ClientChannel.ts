import { JWorker } from './JWorker'
import { Message } from './Message'
import { MethodCallHandler } from './Type'

export class ClientChannel {
  private channelName: string
  private worker: JWorker

  constructor(channelName: string, worker: JWorker) {
    this.channelName = channelName
    this.worker = worker
  }

  setMethodCallHandler(handler: MethodCallHandler) {
    this.worker.setMethodCallHandler(this.channelName, handler)
  }

  send(methodName: string, data: any = undefined, transfer?: ArrayBuffer[]): Promise<any> {
    const message = new Message(this.channelName, methodName, data)
    return new Promise((resolve: Function, reject: Function) => {
      try {
        this.worker.send(message, (result: any) => resolve(result), transfer)
      } catch (error) {
        reject(error)
      }
    })
  }
}