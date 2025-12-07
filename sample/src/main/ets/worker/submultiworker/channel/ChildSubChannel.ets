import { Any, Channel, SubWorker } from "jworker";
import { Task } from "../Data";

export class ChildSubChannel extends Channel {
  private worker: SubWorker

  constructor(worker: SubWorker) {
    super()
    this.worker = worker
  }

  async handleMessage(methodName: string, data: Any) {
    if (methodName == "handleTask") {
      const task = data as Task
      // 模拟耗时任务
      const duration = Math.floor(Math.random() * 1500) + 500
      await this.delay(duration)
      return `【处理完成 ${task.content} 耗时：${duration / 1000} s】`
    } else if (methodName == "exit") {
      this.worker.release()
      return undefined
    }
    return undefined
  }

  async delay(ms: number) {
    return new Promise<Any>(resolve => setTimeout(resolve, ms))
  }
}