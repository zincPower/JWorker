import { MainMultiWorkerComponent } from '../worker/mainmultiworker/MainMultiWorkerComponent'
import { SimpleWorkerComponent } from '../worker/simple/SimpleWorkerComponent'
import { SubMultiWorkerComponent } from '../worker/submultiworker/SubMultiWorkerComponent'

@Entry
@Component
struct Index {
  build() {
    Scroll() {
      Column() {
        SimpleWorkerComponent()
        MainMultiWorkerComponent()
        SubMultiWorkerComponent()
      }
      .width('100%')
    }
    .height('100%')
    .width('100%')
    .align(Alignment.Top)
    .scrollBar(BarState.Off)
  }
}