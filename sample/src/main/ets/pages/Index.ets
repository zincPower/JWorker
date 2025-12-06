import { SimpleWorkerComponent } from '../worker/simple/SimpleWorkerComponent'

@Entry
@Component
struct Index {
  build() {
    Scroll() {
      Column() {
        SimpleWorkerComponent()
      }
      .height('100%')
      .width('100%')
    }
    .height('100%')
    .width('100%')
  }
}