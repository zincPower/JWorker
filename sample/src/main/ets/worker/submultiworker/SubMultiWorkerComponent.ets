import { Any, Channel, createJWorker, JWorker } from "jworker"
import { promptAction } from "@kit.ArkUI"
import { Log } from "../../log/Log"
import { ParentMainChannel } from "./channel/ParentMainChannel"
import { Task } from "./Data"

const TAG = `SubMultiWorkerComponent`

@ComponentV2
export struct SubMultiWorkerComponent {
  private worker: JWorker | undefined = undefined
  private workerChannel: Channel | undefined = undefined

  build() {
    Column() {
      Text(`子 Worker 开启多个 JWorker`)
        .width(`100%`)
        .fontColor(Color.Black)
        .fontWeight(800)
        .fontSize(22)
        .textAlign(TextAlign.Center)
        .margin(5)

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        Text(`JWorker 开启、关闭`)
          .width(`100%`)
          .fontColor(Color.White)
          .fontWeight(800)
          .fontSize(20)
          .textAlign(TextAlign.Center)
          .margin(2.5)

        Button("开启")
          .onClick(async () => {
            if (this.worker != undefined) {
              promptAction.showToast({ message: "Worker 已经启动" })
              return
            }
            this.worker = createJWorker("sample/ets/worker/submultiworker/ParentWorker.ets")
            this.workerChannel = new ParentMainChannel()
            this.worker.addChannel("parentChannel", this.workerChannel)
            this.worker.start()
          }).margin(2.5)

        Button("关 闭")
          .onClick(async () => {
            this.workerChannel?.send("exit")
            this.worker = undefined
            this.workerChannel = undefined
          }).margin(2.5)

      }.backgroundColor(`#BADFDB`)
      .padding({
        left: 5,
        top: 10,
        right: 5,
        bottom: 10,
      }).borderRadius({ topLeft: 5, topRight: 5 })

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        Text(`发送、处理消息`)
          .width(`100%`)
          .fontColor(Color.White)
          .fontWeight(800)
          .fontSize(20)
          .textAlign(TextAlign.Center)
          .margin(2.5)

        Button("发送消息给“孙 worker”")
          .onClick(async () => {
            if (this.worker == undefined) {
              promptAction.showToast({ message: "Worker 还未启动" })
              return
            }
            const tasks: Task[] = [
              { content: "任务1" },
              { content: "任务2" },
              { content: "任务3" },
              { content: "任务4" },
              { content: "任务5" },
            ]
            const response = await this.workerChannel?.send("handleTasks", tasks) as Any
            // if (response != undefined) {
            Log.i(TAG, `【发送消息给“孙 worker”】子 worker 回复消息 response=${JSON.stringify(response)}`)
            // }
          }).margin(2.5)
      }.backgroundColor(`#FFA4A4`)
      .padding({
        left: 5,
        top: 10,
        right: 5,
        bottom: 10,
      })
      .borderRadius({ bottomLeft: 5, bottomRight: 5 })
    }.padding(5)
  }
}