import { MainMultiWorkerComponent } from '../worker/mainmultiworker/MainMultiWorkerComponent'
import { SimpleWorkerComponent } from '../worker/simple/SimpleWorkerComponent'

@Entry
@Component
struct Index {
  build() {
    Scroll() {
      Column() {
        SimpleWorkerComponent()
        MainMultiWorkerComponent()
      }
      .width('100%')
    }
    .height('100%')
    .width('100%')
    .align(Alignment.Top)
    .scrollBar(BarState.Off)
  }
}