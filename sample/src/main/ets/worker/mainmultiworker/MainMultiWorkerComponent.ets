import { Channel, createJWorker, JWorker } from "jworker"
import { promptAction } from "@kit.ArkUI"
import { MainMultiChannel } from "./channel/MainMultiChannel"
import { Log } from "../../log/Log"

const TAG = `MainMultiWorkerComponent`

@ComponentV2
export struct MainMultiWorkerComponent {
  private worker1: JWorker | undefined = undefined
  private worker2: JWorker | undefined = undefined
  private worker1Channel: Channel | undefined = undefined
  private worker2Channel: Channel | undefined = undefined

  build() {
    Column() {
      Text(`项目开启多个 JWorker`)
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

        Button("开启 JWorker1")
          .onClick(async () => {
            if (this.worker1 != undefined) {
              promptAction.showToast({ message: "Worker 已经启动" })
              return
            }
            this.worker1 = createJWorker("sample/ets/worker/mainmultiworker/MainMultiWorker.ets")
            this.worker1Channel = new MainMultiChannel()
            this.worker1.addChannel("multiChannel", this.worker1Channel)
            this.worker1.start()
          }).margin(2.5)

        Button("关闭 JWorker1")
          .onClick(async () => {
            this.worker1?.release()
            this.worker1 = undefined
            this.worker1Channel = undefined
          }).margin(2.5)

        Button("开启 JWorker2")
          .onClick(async () => {
            if (this.worker2 != undefined) {
              promptAction.showToast({ message: "Worker 已经启动" })
              return
            }
            this.worker2 = createJWorker("sample/ets/worker/mainmultiworker/MainMultiWorker.ets")
            this.worker2Channel = new MainMultiChannel()
            this.worker2.addChannel("multiChannel", this.worker2Channel)
            this.worker2.start()
          }).margin(2.5)

        Button("关闭 JWorker2")
          .onClick(async () => {
            this.worker2?.release()
            this.worker2 = undefined
            this.worker2Channel = undefined
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

        Button("使用 JWorker1 的渠道发送")
          .onClick(async () => {
            if (this.worker1 == undefined) {
              promptAction.showToast({ message: "Worker 还未启动" })
              return
            }
            const response = await this.worker1Channel?.send("sayHello") as string
            if (response != undefined) {
              Log.i(TAG, `【使用 JWorker1 的渠道发送】子 worker 回复消息 response=${response}`)
            }
          }).margin(2.5)

        Button("使用 JWorker2 的渠道发送")
          .onClick(async () => {
            if (this.worker2 == undefined) {
              promptAction.showToast({ message: "Worker 还未启动" })
              return
            }
            const response = await this.worker2Channel?.send("sayHello") as string
            if (response != undefined) {
              Log.i(TAG, `【使用 JWorker2 的渠道发送】子 worker 回复消息 response=${response}`)
            }
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