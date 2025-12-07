import { Any, Channel } from "jworker";

export class ParentMainChannel extends Channel {
  async handleMessage(methodName: string, data: Any) {
  }
}