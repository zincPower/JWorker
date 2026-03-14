import { MainMultiWorkerComponent } from '../workers/mainmultiworker/MainMultiWorkerComponent'
import { SimpleWorkerComponent } from '../workers/simple/SimpleWorkerComponent'
import { SubMultiWorkerComponent } from '../workers/submultiworker/SubMultiWorkerComponent'
import { HarWorkerComponent } from 'sample_har'

@Entry
@Component
struct Index {
  build() {
    Scroll() {
      Column() {
        SimpleWorkerComponent()
        MainMultiWorkerComponent()
        SubMultiWorkerComponent()
        HarWorkerComponent()
      }
      .width('100%')
    }
    .height('100%')
    .width('100%')
    .align(Alignment.Top)
    .scrollBar(BarState.Off)
  }
}