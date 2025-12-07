import { Any, Channel, createJWorker, JWorker, SubWorker } from "jworker";
import { Task } from "../Data";
import { ChildMainChannel } from "./ChildMainChannel";
import { systemDateTime } from "@kit.BasicServicesKit";
import { Log } from "../../../log/Log";

const TAG = "ParentSubChannel"

export class ParentSubChannel extends Channel {
  worker: SubWorker | undefined
  childWorker1: JWorker | undefined
  childWorker1Channel: Channel | undefined
  childWorker2: JWorker | undefined
  childWorker2Channel: Channel | undefined
  childWorker3: JWorker | undefined
  childWorker3Channel: Channel | undefined

  constructor(worker: SubWorker) {
    super()
    this.worker = worker
    this.startChildrenWorker()
  }

  async handleMessage(methodName: string, data: Any) {
    switch (methodName) {
      case "handleTasks": {
        const startTime = systemDateTime.getTime(false)
        const tasks = data as Task[]
        const workerChannels = [this.childWorker1Channel, this.childWorker2Channel, this.childWorker3Channel]
        const promises: Promise<Any>[] = []
        for (let i = 0; i < tasks.length; i++) {
          const channel = workerChannels[i %workerChannels.length]
          const promise: Promise<Any> | undefined = channel?.send("handleTask", tasks[i])
          if (promise) {
            promises.push(promise)
          }
        }
        const result = await Promise.all(promises)
        const duration = systemDateTime.getTime(false) - startTime
        return result.filter(item => typeof item === 'string').join(' ') + `耗时：${duration/1_000} s`
      }
      case "exit": {
        await Promise.all([this.childWorker1Channel?.send("exit"), this.childWorker2Channel?.send("exit"), this.childWorker3Channel?.send("exit")])
        Log.i(TAG, "【exit】")
        await this.worker?.release()
        this.worker = undefined
        this.childWorker1 = undefined
        this.childWorker1Channel = undefined
        this.childWorker2 = undefined
        this.childWorker2Channel = undefined
        this.childWorker3 = undefined
        this.childWorker3Channel = undefined
        return undefined
      }
      default: {
        return undefined
      }
    }
  }

  private startChildrenWorker() {
    if (this.childWorker1 == undefined) {
      this.childWorker1 = createJWorker("sample/ets/worker/submultiworker/ChildWorker.ets")
      this.childWorker1Channel = new ChildMainChannel()
      this.childWorker1.addChannel("childChannel", this.childWorker1Channel)
      this.childWorker1.start()
    }
    if (this.childWorker2 == undefined) {
      this.childWorker2 = createJWorker("sample/ets/worker/submultiworker/ChildWorker.ets")
      this.childWorker2Channel = new ChildMainChannel()
      this.childWorker2.addChannel("childChannel", this.childWorker2Channel)
      this.childWorker2.start()
    }
    if (this.childWorker3 == undefined) {
      this.childWorker3 = createJWorker("sample/ets/worker/submultiworker/ChildWorker.ets")
      this.childWorker3Channel = new ChildMainChannel()
      this.childWorker3.addChannel("childChannel", this.childWorker3Channel)
      this.childWorker3.start()
    }
  }
}