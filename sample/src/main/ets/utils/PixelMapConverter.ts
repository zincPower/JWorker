import image from '@ohos.multimedia.image';
import { BusinessError } from '@ohos.base';

/**
 * PixelMap 和 ArrayBuffer 转换工具类
 */
export class PixelMapConverter {

  /**
   * 方法1: PixelMap 转 ArrayBuffer (通过图片编码)
   * 适用场景: 需要在 Worker 间传递、保存到文件等
   * @param pixelMap - 源 PixelMap
   * @param format - 图片格式 ('image/jpeg' | 'image/png' | 'image/webp')
   * @param quality - 图片质量 (1-100)
   * @returns ArrayBuffer
   */
  static async pixelMapToArrayBuffer(
    pixelMap: image.PixelMap,
    format: string = 'image/png',
    quality: number = 100
  ): Promise<ArrayBuffer> {
    try {
      const imagePacker = image.createImagePacker();
      const packOpts: image.PackingOption = {
        format: format,
        quality: quality
      };

      const arrayBuffer = await imagePacker.packing(pixelMap, packOpts);

      // 释放资源
      imagePacker.release();

      return arrayBuffer;
    } catch (error) {
      const err = error as BusinessError;
      console.error(`PixelMap转ArrayBuffer失败: ${err.code}, ${err.message}`);
      throw error;
    }
  }

  /**
   * 方法2: PixelMap 转 ArrayBuffer (原始像素数据)
   * 适用场景: 需要直接访问像素数据进行处理
   * @param pixelMap - 源 PixelMap
   * @returns { buffer: ArrayBuffer, width: number, height: number, format: number }
   */
  static async pixelMapToRawBuffer(pixelMap: image.PixelMap): Promise<{
    buffer: ArrayBuffer;
    width: number;
    height: number;
    format: number;
  }> {
    try {
      const imageInfo = await pixelMap.getImageInfo();
      const width = imageInfo.size.width;
      const height = imageInfo.size.height;
      const format = imageInfo.pixelFormat;

      // 计算缓冲区大小 (RGBA 格式每像素 4 字节)
      const pixelBytesNumber = width * height * 4;
      const readBuffer = new ArrayBuffer(pixelBytesNumber);

      // 读取像素数据到缓冲区
      await pixelMap.readPixelsToBuffer(readBuffer);

      return {
        buffer: readBuffer,
        width: width,
        height: height,
        format: format
      };
    } catch (error) {
      const err = error as BusinessError;
      console.error(`读取像素数据失败: ${err.code}, ${err.message}`);
      throw error;
    }
  }

  /**
   * 方法3: ArrayBuffer 转 PixelMap (通过图片解码)
   * 适用场景: ArrayBuffer 是编码后的图片数据 (JPEG/PNG等)
   * @param buffer - 图片数据的 ArrayBuffer
   * @param options - 解码选项
   * @returns PixelMap
   */
  static async arrayBufferToPixelMap(
    buffer: ArrayBuffer,
    options?: image.DecodingOptions
  ): Promise<image.PixelMap> {
    try {
      const imageSource = image.createImageSource(buffer);

      const defaultOptions: image.DecodingOptions = {
        editable: true,
        desiredPixelFormat: image.PixelMapFormat.RGBA_8888,
        ...options
      };

      const pixelMap = await imageSource.createPixelMap(defaultOptions);

      // 释放资源
      imageSource.release();

      return pixelMap;
    } catch (error) {
      const err = error as BusinessError;
      console.error(`ArrayBuffer转PixelMap失败: ${err.code}, ${err.message}`);
      throw error;
    }
  }

  /**
   * 方法4: ArrayBuffer 转 PixelMap (原始像素数据)
   * 适用场景: ArrayBuffer 是原始像素数据
   * @param buffer - 原始像素数据
   * @param width - 图片宽度
   * @param height - 图片高度
   * @param format - 像素格式
   * @returns PixelMap
   */
  static async rawBufferToPixelMap(
    buffer: ArrayBuffer,
    width: number,
    height: number,
    format: image.PixelMapFormat = image.PixelMapFormat.RGBA_8888
  ): Promise<image.PixelMap> {
    try {
      const opts: image.InitializationOptions = {
        size: { width: width, height: height },
        pixelFormat: format,
        editable: true,
        alphaType: image.AlphaType.UNPREMUL
      };

      const pixelMap = await image.createPixelMap(buffer, opts);

      return pixelMap;
    } catch (error) {
      const err = error as BusinessError;
      console.error(`原始数据转PixelMap失败: ${err.code}, ${err.message}`);
      throw error;
    }
  }

  /**
   * 方法5: 带裁剪的 ArrayBuffer 转 PixelMap
   * @param buffer - 图片数据的 ArrayBuffer
   * @param cropRegion - 裁剪区域
   * @returns PixelMap
   */
  static async arrayBufferToPixelMapWithCrop(
    buffer: ArrayBuffer,
    cropRegion: { x: number; y: number; width: number; height: number }
  ): Promise<image.PixelMap> {
    try {
      const imageSource = image.createImageSource(buffer);

      const decodingOptions: image.DecodingOptions = {
        editable: true,
        desiredPixelFormat: image.PixelMapFormat.RGBA_8888,
        desiredRegion: {
          size: { width: cropRegion.width, height: cropRegion.height },
          x: cropRegion.x,
          y: cropRegion.y
        }
      };

      const pixelMap = await imageSource.createPixelMap(decodingOptions);
      imageSource.release();

      return pixelMap;
    } catch (error) {
      const err = error as BusinessError;
      console.error(`裁剪转换失败: ${err.code}, ${err.message}`);
      throw error;
    }
  }

  /**
   * 方法6: 裁剪中心区域的 ArrayBuffer 转 PixelMap
   * @param buffer - 图片数据的 ArrayBuffer
   * @param cropWidth - 裁剪宽度
   * @param cropHeight - 裁剪高度
   * @returns PixelMap
   */
  static async arrayBufferToPixelMapCropCenter(
    buffer: ArrayBuffer,
    cropWidth: number,
    cropHeight: number
  ): Promise<image.PixelMap> {
    try {
      const imageSource = image.createImageSource(buffer);
      const imageInfo = await imageSource.getImageInfo();

      const originalWidth = imageInfo.size.width;
      const originalHeight = imageInfo.size.height;

      // 计算中心裁剪区域
      const x = Math.floor((originalWidth - cropWidth) / 2);
      const y = Math.floor((originalHeight - cropHeight) / 2);

      const pixelMap = await this.arrayBufferToPixelMapWithCrop(buffer, {
        x: x,
        y: y,
        width: cropWidth,
        height: cropHeight
      });

      imageSource.release();

      return pixelMap;
    } catch (error) {
      const err = error as BusinessError;
      console.error(`中心裁剪失败: ${err.code}, ${err.message}`);
      throw error;
    }
  }
}