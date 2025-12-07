import { Any, Channel } from "jworker";
import { Log } from "../../log/Log";
import { User } from "./Bean";

const TAG = "MainSimpleChannel"

export class MainSimpleChannel extends Channel {
  async handleMessage(methodName: string, data: Any): Promise<Any> {
    Log.i(TAG, `【handleMessage】methodName=${methodName} data=${data}`)
    switch (methodName) {
      case "getUserInfo": {
        return {
          "name": "江澎涌",
          "year": 1994,
          height: 170.0,
          "address": {
            "country": "中国",
            "province": "广东",
            "city": "普宁",
          },
        } as User
      }
      default: {
        return undefined
      }
    }
  }
}