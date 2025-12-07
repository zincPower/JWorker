/**
 * 任意类型，为了补充 ets 无法使用 any
 */
export type Any = null | undefined | {} | Function

/**
 * MessageHandler 的 handleMessage 返回携带 ArrayBuffer 数据时，则需要使用该类包裹
 * JWorker 会获取对应的 transfer 的 ArrayBuffer 数组，让他的使用权转移
 */
export class TransferData {
  data: any
  transfer: ArrayBuffer[]

  constructor(data, transfer: ArrayBuffer[]) {
    this.data = data
    this.transfer = transfer
  }
}

/**
 * 答复调用
 */
export type Reply = (data: any) => void

/**
 * 消息，用于包装用户发送的消息
 */
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

/**
 * 信封，用于包装消息，后续返回值可以找到 Reply 实现答复
 */
export class Envelope {
  responseId: number // 发送标识
  message: Message // 信息

  constructor(responseId: number, message: Message) {
    this.responseId = responseId
    this.message = message
  }
}