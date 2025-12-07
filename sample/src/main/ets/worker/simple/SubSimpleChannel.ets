import { Any, SubWorker, TransferData } from "jworker";
import { Log } from "../../log/Log";
import { User } from "./Bean";
import { image } from "@kit.ImageKit";
import { PixelMapConverter } from "../../utils/PixelMapConverter";
import { Channel } from "jworker/src/main/ets/Channel";

const TAG = "SubSimpleChannel"

export class SubSimpleChannel extends Channel {
  worker: SubWorker

  constructor(worker: SubWorker) {
    super()
    this.worker = worker
  }

  async handleMessage(methodName: string, data: Any): Promise<Any> {
    Log.i(TAG, `【handleMessage】methodName=${methodName} data=${data}`)
    switch (methodName) {
      case "sayHello": {
        const name = data as string
        return `Hello, ${name}. I'm replying to you from the sub-worker.`
      }
      case "complexStructure": {
        const user = data as User
        user.name = "江澎涌"
        user.address.city = "PuNing"
        return user
      }
      case "cropImage": {
        const arrayBuffer = data as ArrayBuffer
        const cropPixelMap = await this.cropImage(arrayBuffer)
        const cropArrayBuffer = await PixelMapConverter.pixelMapToArrayBuffer(cropPixelMap)
        return new TransferData(cropArrayBuffer, [cropArrayBuffer])
      }
      case "getUserName": {
        const user = await this.send("getUserInfo") as User
        return user.name
      }
      case "exit": {
        this.worker.close()
        return `Bye, I've already closed at sub-worker.`
      }
      default: {
        return undefined
      }
    }
  }

  async cropImage(buffer: ArrayBuffer): Promise<image.PixelMap | undefined> {
    try {
      const imageSource = image.createImageSource(buffer)
      const imageInfo = await imageSource.getImageInfo()
      const originalWidth = imageInfo.size.width
      const originalHeight = imageInfo.size.height

      const cropWidth = originalWidth / 2
      const cropHeight = originalHeight / 2

      const x = Math.floor((originalWidth - cropWidth) / 2)
      const y = Math.floor((originalHeight - cropHeight) / 2)

      const decodingOptions: image.DecodingOptions = {
        editable: true,
        desiredPixelFormat: image.PixelMapFormat.RGBA_8888,
        desiredRegion: {
          size: { width: cropWidth, height: cropHeight },
          x: x,
          y: y
        }
      }
      const pixelMap = await imageSource.createPixelMap(decodingOptions)
      return pixelMap
    } catch (e) {
      Log.e(TAG, `【cropImage】异常 e=${e}`)
      return undefined
    }
  }
}