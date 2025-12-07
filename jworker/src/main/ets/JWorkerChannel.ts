import { Channel } from "./Channel"
import { Message } from "./Data"
import { subWorkerHandler } from "./SubWorkerHandler"

export function JWorkerChannel(channelName: string, channel: Channel) {
  subWorkerHandler.channels.set(channelName, channel)
  channel.send = async (methodName: string, data: any = undefined, transfer?: ArrayBuffer[]) => {
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