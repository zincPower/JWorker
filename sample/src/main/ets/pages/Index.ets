import { SimpleWorkerComponent } from '../worker/simple/component/SimpleWorkerComponent'

@Entry
@Component
struct Index {
  build() {
    Scroll() {
      Column() {
        SimpleWorkerComponent()
      }
      .width('100%')
    }
    .height('100%')
    .width('100%')
    .align(Alignment.Top)
    .scrollBar(BarState.Off)
  }
}