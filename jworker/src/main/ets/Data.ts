export type Reply = (data: any) => void

export type MethodCallHandler = (methodName: string, data: any) => Promise<any>

export type Any = null | undefined | {} | Function

export class Message {
  channelName: string // 渠道名
  methodName: string // 方法名
  data: any // 携带数据

  constructor(channelName: string, methodName: string, data: any) {
    this.channelName = channelName
    this.methodName = methodName
    this.data = data
  }
}

export class Envelope {
  responseId: number // 发送标识
  message: Message // 信息

  constructor(responseId: number, message: Message) {
    this.responseId = responseId
    this.message = message
  }
}