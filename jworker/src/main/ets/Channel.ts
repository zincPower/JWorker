import { MethodCallHandler } from "./Data";

export interface Channel {
  setMethodCallHandler(handler: MethodCallHandler)

  send(methodName: string, data?: any, transfer?: ArrayBuffer[]): Promise<any>
}