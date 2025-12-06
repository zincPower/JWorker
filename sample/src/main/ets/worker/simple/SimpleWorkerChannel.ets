import { Any, SubWorker, TransferData } from "jworker";
import { Log } from "../../log/Log";
import { ReadImage, User } from "./Bean";
import { image } from "@kit.ImageKit";
import { PixelMapConverter } from "../../utils/PixelMapConverter";

const TAG = "SimpleWorkerChannel"

export class SimpleWorkerChannel {
  worker: SubWorker

  constructor(worker: SubWorker) {
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
      case "getImage": {
        try {
          const readImage = data as ReadImage
          const resMgr = readImage.context.resourceManager
          const uint8Array = await resMgr.getRawFileContent(readImage.imagePath)
          const arrayBuffer = uint8Array.buffer
          return new TransferData(arrayBuffer, [arrayBuffer])
        } catch (error) {
          Log.e(TAG, `【getImage】获取图片异常 error=${error} data=${JSON.stringify(data)}`)
          return undefined
        }
      }
      case "cropImage": {
        const arrayBuffer = data as ArrayBuffer
        const cropPixelMap = await this.cropImage(arrayBuffer)
        const cropArrayBuffer = await PixelMapConverter.pixelMapToArrayBuffer(cropPixelMap)
        return new TransferData(cropArrayBuffer, [cropArrayBuffer])
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