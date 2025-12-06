import { Channel } from "../Channel"
import { Message, MethodCallHandler } from "../Data"
import { subWorkerHandler } from "../SubWorkerHandler"

class SubWorkerChannel implements Channel {
  private channelName: string

  constructor(channelName: string) {
    this.channelName = channelName
  }

  setMethodCallHandler(handler: MethodCallHandler) {
    subWorkerHandler.methodHandlerMap.set(this.channelName, handler)
  }

  send(methodName: string, data: any = undefined, transfer?: ArrayBuffer[]): Promise<any> {
    const message = new Message(this.channelName, methodName, data)
    return new Promise((resolve: Function, reject: Function) => {
      try {
        subWorkerHandler.send(message, (result: any) => resolve(result), transfer)
      } catch (error) {
        reject(error)
      }
    })
  }
}

export function JWorkerChannel(channelName: string, methodHandler: MethodCallHandler): Channel {
  const channel = new SubWorkerChannel(channelName)
  channel.setMethodCallHandler(methodHandler)
  return channel
}