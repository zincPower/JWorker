import { Any, ClientChannel, JWorker } from 'jworker';
import { Log } from '../log/Log';
import { worker } from '@kit.ArkTS';

const TAG = "Index"

@Entry
@Component
struct Index {
  build() {
    Scroll() {
      Column() {
        this.simpleWorker()
      }
      .height('100%')
      .width('100%')
    }
    .height('100%')
    .width('100%')
  }

  @Builder
  simpleWorker() {
    Column() {
      Text(`常规使用`)
        .width(`100%`)
        .fontColor(Color.Black)
        .fontWeight(800)
        .fontSize(20)
        .textAlign(TextAlign.Center)
      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        Button("启动 Worker")
          .onClick(async () => {
            const worker = new JWorker("sample/ets/worker/SimpleWorker.ets")
            const simpleWorkerChannel = new ClientChannel("SimpleWorkerChannel", worker)
            simpleWorkerChannel.setMethodCallHandler(async (methodName: string, data: Any) => {
              Log.i(TAG, `【SimpleWorkerChannel-handleMessage】methodName=${methodName} data=${data}`)
            })
            worker.init()
            simpleWorkerChannel.send("江澎涌")
          }).margin(2.5)

      }.backgroundColor(`#91d5ff`)
      .borderRadius(5)
      .padding(10)
      .margin(10)
    }
  }
}