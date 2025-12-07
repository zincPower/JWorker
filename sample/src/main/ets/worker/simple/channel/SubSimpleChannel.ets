import { Any, Channel, SubWorker, TransferData } from "jworker";
import { Log } from "../../../log/Log";
import { User } from "../Bean";
import { image } from "@kit.ImageKit";
import { PixelMapConverter } from "../../../utils/PixelMapConverter";
import { effectKit } from "@kit.ArkGraphics2D";

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
        const user = data as User
        return `Hello, ${user.name}. I'm replying to you from the sub-worker.`
      }
      case "cropImage": {
        const arrayBuffer = data as ArrayBuffer
        const cropPixelMap = await this.cropImage(arrayBuffer)
        const cropArrayBuffer = await PixelMapConverter.pixelMapToArrayBuffer(cropPixelMap)
        return new TransferData(cropArrayBuffer, [cropArrayBuffer])
      }
      case "getUserDes": {
        const user = await this.send("getUserInfo") as User
        return `name: ${user.name}, height: ${user.height}`
      }
      case "subNoProcessor": {
        return await this.send("noProcessor") as Any
      }
      case "filterImage": {
        const imagePath = data as string
        const imageArrayBuffer = await this.send("loadImage", imagePath) as ArrayBuffer
        const imagePixelMap = await PixelMapConverter.arrayBufferToPixelMap(imageArrayBuffer)
        const filter = effectKit.createEffect(imagePixelMap)
        filter.blur(20)
        const resultPixelMap = await filter.getEffectPixelMap()
        const filterArrayBuffer = await PixelMapConverter.pixelMapToArrayBuffer(resultPixelMap)
        return new TransferData(filterArrayBuffer, [filterArrayBuffer])
      }
      case "exit": {
        this.worker.release()
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