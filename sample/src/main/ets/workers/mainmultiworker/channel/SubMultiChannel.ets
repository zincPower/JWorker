import { Any, Channel, SubWorker, TransferData } from "jworker";
import systemDateTime from "@ohos.systemDateTime";

export class SubMultiChannel extends Channel {
  id = systemDateTime.getTime(true)

  async handleMessage(methodName: string, data: Any) {
    if (methodName == "sayHello") {
      return `Hello, I'm jiangpengyong. I'm replying to you from the sub-worker[${this.id}].`
    }
    return undefined
  }
}