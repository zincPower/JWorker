import { Message } from './Message'
import { subWorkerHandler } from './SubWorkerHandler'
import { MethodCallHandler } from './Type'

class ServerChannelProxy {
  private channelName: string

  constructor(channelName: string) {
    this.channelName = channelName
  }

  send(methodName: string, data: any = undefined, transfer?: ArrayBuffer[]): Promise<any> {
    let message = new Message(this.channelName, methodName, data)
    return new Promise((resolve: Function, reject: Function) => {
      try {
        subWorkerHandler.send(message, (result: any) => resolve(result), transfer)
      } catch (error) {
        reject(error)
      }
    })
  }
}

export function ServerChannel(channelName: string, methodHandler: MethodCallHandler): ServerChannelProxy {
  subWorkerHandler.methodHandlerMap.set(channelName, methodHandler)
  return new ServerChannelProxy(channelName)
}