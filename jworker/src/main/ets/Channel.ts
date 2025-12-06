import { MethodCallHandler } from "./Data"

/**
 * JWorker 通讯渠道
 */
export interface Channel {
  /**
   * 设置渠道接收消息处理器
   * @param handler 消息处理器
   */
  setMethodCallHandler(handler: MethodCallHandler)

  /**
   * 发送消息，A Worker ----发送消息----> B Worker，则 A Worker 调用该方法1
   * @param methodName 方法名称
   * @param data 数据
   * @param transfer 需要移交的 array buffer ，移交后当前 Worker 则不能再使用当前 array buffer
   * @returns 异步返回，内容即为另外 Worker 处理后返回数据
   */
  send(methodName: string, data?: any, transfer?: ArrayBuffer[]): Promise<any>
}