import { Any, createJWorker, JWorker } from "jworker"
import { Channel } from "jworker/src/main/ets/Channel"
import { Log } from "../../log/Log"
import { User } from "./Bean"
import { promptAction } from "@kit.ArkUI"
import { PixelMapConverter } from "../../utils/PixelMapConverter"
import { MainSimpleChannel } from "./MainSimpleChannel"

const TAG = `SimpleWorkerComponent`

@ComponentV2
export struct SimpleWorkerComponent {
  private worker: JWorker | undefined = undefined
  private simpleWorkerChannel: Channel | undefined = undefined
  @Local private cropPixelMap: PixelMap | undefined = undefined

  build() {
    Column() {
      Text(`常规使用`)
        .width(`100%`)
        .fontColor(Color.Black)
        .fontWeight(800)
        .fontSize(22)
        .textAlign(TextAlign.Center)
        .margin(5)

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        Text(`生命周期`)
          .width(`100%`)
          .fontColor(Color.White)
          .fontWeight(800)
          .fontSize(20)
          .textAlign(TextAlign.Center)
          .margin(2.5)

        Button("启动 Worker")
          .onClick(async () => {
            if (this.worker) {
              promptAction.showToast({ message: `已经有 Worker 啦，不再创建` })
              return
            }
            this.worker = createJWorker("sample/ets/worker/simple/SimpleWorker.ets")
            this.simpleWorkerChannel = new MainSimpleChannel()
            this.worker.addChannel("SimpleWorkerChannel", this.simpleWorkerChannel)
            this.worker.start()
          }).margin(2.5)

        Button("在父 Worker 关闭")
          .onClick(async () => {
            this.worker?.release()
            this.simpleWorkerChannel = undefined
            this.worker = undefined
          }).margin(2.5)

        Button("在子 Worker 关闭")
          .onClick(async () => {
            const response = await this.simpleWorkerChannel?.send("exit") as Any
            Log.i(TAG, `子 Worker 回复 response=${JSON.stringify(response)}`)
            this.simpleWorkerChannel = undefined
            this.worker = undefined
          }).margin(2.5)
      }.backgroundColor(`#BADFDB`)
      .padding(5)
      .borderRadius({ topLeft: 5, topRight: 5 })

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        Text(`发送、处理消息\n主 Worker ---> 子 Worker`)
          .width(`100%`)
          .fontColor(Color.White)
          .fontWeight(800)
          .fontSize(20)
          .textAlign(TextAlign.Center)
          .margin(2.5)

        Button("处理简单消息")
          .onClick(async () => {
            if (this.simpleWorkerChannel == null) {
              promptAction.showToast({ message: "Worker 还没有启动" })
              return
            }
            const response = (await this.simpleWorkerChannel?.send("sayHello", "江澎涌")) as Any
            Log.i(TAG, `【发送有处理的消息】子 Worker 回复 response=${JSON.stringify(response)}`)
          }).margin(2.5)

        Button("无处理的消息")
          .onClick(async () => {
            if (this.simpleWorkerChannel == null) {
              promptAction.showToast({ message: "Worker 还没有启动" })
              return
            }
            const response = (await this.simpleWorkerChannel?.send("noProcessor")) as Any
            Log.i(TAG, `【发送无处理的消息】子 Worker 回复 response=${JSON.stringify(response)}`)
          }).margin(2.5)

        Button("发送复杂结构消息")
          .onClick(async () => {
            if (this.simpleWorkerChannel == null) {
              promptAction.showToast({ message: "Worker 还没有启动" })
              return
            }
            const user = {
              "name": "jiangpengyong",
              "year": 1994,
              height: 170.0,
              "address": {
                "country": "China",
                "province": "GuangDong",
                "city": "Guangzhou",
              },
            } as User
            const response = (await this.simpleWorkerChannel?.send("complexStructure", user)) as Any
            Log.i(TAG, `【复杂结构消息】发送前父 Worker 数据 user=${JSON.stringify(user)} 子 Worker 回复 response=${JSON.stringify(response)}`)
          }).margin(2.5)

        Button("获取图片")
          .onClick(async () => {
            if (this.simpleWorkerChannel == null) {
              promptAction.showToast({ message: "Worker 还没有启动" })
              return
            }
            const uint8Array = await getContext(this).resourceManager.getRawFileContent("image1.jpeg")
            const arrayBuffer = uint8Array.buffer
            const response = await this.simpleWorkerChannel.send("cropImage", arrayBuffer, [arrayBuffer]) as ArrayBuffer | undefined
            if (response) {
              this.cropPixelMap = await PixelMapConverter.arrayBufferToPixelMap(response)
            }
          }).margin(2.5)

        Row() {
          Text("主 Worker 原图")
            .layoutWeight(1)
            .height(20)
            .fontSize(12)
            .fontColor(Color.White)
            .textAlign(TextAlign.Center)
          Text("子 Worker 裁剪")
            .layoutWeight(1)
            .height(20)
            .fontSize(12)
            .fontColor(Color.White)
            .textAlign(TextAlign.Center)
        }.width(`100%`)
        .visibility(this.cropPixelMap == undefined ? Visibility.None : Visibility.Visible)

        Row() {
          Image($rawfile('image1.jpeg'))
            .layoutWeight(1)
            .objectFit(ImageFit.Contain)
          Image(this.cropPixelMap)
            .layoutWeight(1)
            .objectFit(ImageFit.Contain)
        }.width(`100%`)
        .height(200)
        .visibility(this.cropPixelMap == undefined ? Visibility.None : Visibility.Visible)
      }.backgroundColor(`#FFA4A4`)
      .padding(5)

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        Text(`发送、处理消息\n子 Worker ---> 主 Worker`)
          .width(`100%`)
          .fontColor(Color.White)
          .fontWeight(800)
          .fontSize(20)
          .textAlign(TextAlign.Center)
          .margin(2.5)

        Button("子 Worker 主动获取复杂信息")
          .onClick(async () => {
            if (this.simpleWorkerChannel == null) {
              promptAction.showToast({ message: "Worker 还没有启动" })
              return
            }
            const response = (await this.simpleWorkerChannel?.send("getUserName")) as Any
            Log.i(TAG, `【子 Worker 主动获取复杂信息】子 Worker 回复 response=${JSON.stringify(response)}`)
          }).margin(2.5)

      }.backgroundColor(`#FFBDBD`)
      .padding(5)
      .borderRadius({ bottomLeft: 5, bottomRight: 5 })

    }.padding(5)
  }
}