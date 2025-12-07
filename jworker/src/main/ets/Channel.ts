/**
 * JWorker 通讯渠道
 */
export abstract class Channel {
  /**
   * 处理消息
   * @param methodName 处理方法的名字
   * @param data 处理的数据
   * @returns 处理完返回的数据，会将返回值传递到 send 调用点作为返回值
   */
  abstract handleMessage(methodName: string, data: any): Promise<any>

  /**
   * 发送消息，A Worker ----发送消息----> B Worker，则 A Worker 调用该方法1
   * @param methodName 方法名字
   * @param data 传递的数据
   * @param transfer 需要移交的 array buffer ，移交后当前 Worker 则不能再使用当前 array buffer
   * @returns 对方 Worker 处理的返回值
   */
  send: (methodName: string, data?: any, transfer?: ArrayBuffer[]) => Promise<any>
}