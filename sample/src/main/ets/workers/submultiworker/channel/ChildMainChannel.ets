import { Any, Channel } from "jworker";

export class ChildMainChannel extends Channel {
  async handleMessage(methodName: string, data: Any) {
  }
}