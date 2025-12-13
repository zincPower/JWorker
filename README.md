# JWorker

**JWorker 是一套简单易用的基于鸿蒙 Worker 的双向 RPC 通讯机制。**

![](https://github.com/zincPower/JWorker/blob/main/img/structure.png)

传统的 Worker 通讯基于事件监听和消息传递，缺乏原生的 `Promise/async-await` 支持，导致逻辑割裂。**JWorker 通过双向 RPC 机制，让主 Worker 可以 await 子 Worker 的执行结果，子 Worker 也可以 await 主 Worker 的响应，将跨 Worker 通讯简化为像调用本地异步函数，消除回调嵌套，保持代码线性流畅。**

## 一、集成

## 二、常规使用

JWorker 是基于鸿蒙 Worker 封装的一套 RPC 通讯机制，所以在正式使用之前需要先添加和配置 Worker 的 ets 文件。可以按照[鸿蒙官方 Worker](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/worker-introduction) 的使用文档进行添加配置，这里就不再赘述。

### 1、创建 JWorker

**主 Worker 中**使用 `createJWorker(workerPath: string)` 创建 `JWorker` 实例，然后调用 `JWorker.start()` 启动 `JWorker` 。 完整代码如下：

> `JWorker.start()` 内部会启动 Worker 文件，并关联消息接收、退出接收等回调。

```ts
// 将 Worker 的文件路径传给 createJWorker 方法，会返回 JWorker 实例
this.worker = createJWorker("sample/ets/worker/simple/SimpleWorker.ets")
// 启动 JWorker
this.worker.start()
```

**子 Worker 中**使用 `initJWorker()` 获取 `SubWorker` 实例。完整代码如下：

> `initJWorker()` 内部会让 `SubWorker` 关联子 Worker 的消息接收等回调。

```ts
const worker = initJWorker()
```

### 2、双向 RPC 通讯

**JWorker 的通讯是基于 Channel** ，所以主子 Worker 的通讯需要先添加**相同名称的 Channel**。

**主 Worker** 通过 `JWorker.addChannel(channelName: string, channel: Channel)` 方法进行添加通讯 Channel 。

```ts
// 创建通讯渠道 MainSimpleChannel ，需要继承 Channel 
this.simpleWorkerChannel = new MainSimpleChannel()
// 添加渠道名为 “SimpleWorkerChannel” 的通讯 Channel 
this.worker.addChannel("SimpleWorkerChannel", this.simpleWorkerChannel)
```

**子 Worker** 通过 `JWorkerChannel(channelName: string, channel: Channel)` 方法进行添加通讯 Channel 。

```ts
// 添加渠道名为 “SimpleWorkerChannel” 的通讯 Channel
// 同样 SubSimpleChannel 也需要继承 Channel
JWorkerChannel("SimpleWorkerChannel", new SubSimpleChannel(worker))
```

**主 Worker 和子 Worker 通过相同的渠道名称建立通讯通道**，`MainSimpleChannel` 和 `SubSimpleChannel` 通讯规则如下：

- 通过 `handleMessage(methodName: string, data: any): Promise<any>` 接收对方的调用消息，返回值会返回到调用点；
- 通过 `send(methodName: string, data?: any, transfer?: ArrayBuffer[]) => Promise<any>` 可以主动调用对方方法并携带参数，对方处理完的返回值会以 `Promise<any>` 类型返回到调用点。

**主 Worker 调用子 Worker 的逻辑**，通过注册的 `simpleWorkerChannel` 调用 `send` 方法发送即可。

```ts
// ============== 主 Worker 中进行发送 ==============
const user = {
  "name": "jiangpengyong",
  "year": 1994,
  "height": 170.0,
  "address": {
    "country": "China",
    "province": "GuangDong",
    "city": "Guangzhou",
  },
} as User
// 第一个参数为调用方法名称，第二个参数为调用方法的参数
// response 为子 Worker 处理的结果
const response = (await this.simpleWorkerChannel?.send("sayHello", user)) as Any
Log.i(TAG, `【发送有处理的消息】子 Worker 回复 response=${JSON.stringify(response)}`)

// ============== 子 Worker 中进行接收处理 ==============
// 通过 SubSimpleChannel 接收调用方法名称和参数，处理后返回结果
export class SubSimpleChannel extends Channel {
  async handleMessage(methodName: string, data: Any): Promise<Any> {
    switch (methodName) {
      // 处理主 Worker 调用的 “sayHello” 方法，将 data 转为 User 类型并获取对应数据，返回一个 string 结果
      case "sayHello": {
        const user = data as User
        return `Hello, ${user.name}. I'm replying to you from the sub-worker.`
      }
      // 省略其他方法
    }
  }
}

// ============== 最终会在 Log 中看到以下输出 ==============
// 【发送有处理的消息】子 Worker 回复 response="Hello, jiangpengyong. I'm replying to you from the sub-worker."
```

**子 Worker 调用主 Worker 的逻辑**，也是同样的流程，通过注册的 `SubSimpleChannel` 调用 `send` 方法发送即可。

```ts
// ============== 子 Worker 调用主 Worker 的逻辑 ==============
export class SubSimpleChannel extends Channel {
  async handleMessage(methodName: string, data: Any): Promise<Any> {
    switch (methodName) {
      case "getUserDes": {
        // 调用主 Worker 的 “getUserInfo” 方法，此处没有携带参数，会返回 User 类型
        const user = await this.send("getUserInfo") as User
        return `name: ${user.name}, height: ${user.height}`
      }
      // 省略其他逻辑
    }
  }
}

// ============== 主 Worker 处理逻辑 ==============
export class MainSimpleChannel extends Channel {
  async handleMessage(methodName: string, data: Any): Promise<Any> {
    switch (methodName) {
      // 接收到子 Worker 的请求处理，处理完之后返回数据
      case "getUserInfo": {
        return {
          "name": "江澎涌",
          "year": 1994,
          "height": 170.0,
          "address": {
            "country": "中国",
            "province": "广东",
            "city": "普宁",
          },
        } as User
      }
    }
  }
}
```

> Channel 中包含了 `send(methodName: string, data?: any, transfer?: ArrayBuffer[]) => Promise<any>` 方法，可以在 “ Channel 内部主动调用” 或是 “外部代码通过 Channel 实例主动调用”，`await` 数据返回即可。

### 3、传递 ArrayBuffer 数据

ts 的 Worker 传递 ArrayBuffer 时，为了不拷贝提升效率，会将 ArrayBuffer 移交给另一方，JWorker 也同样提供这一能力。

![](https://github.com/zincPower/JWorker/blob/main/img/transfer_data.png)

上图则是一个完整的移交 ArrayBuffer 数据控制权的全流程

**发起调用传递 ArrayBuffer 类型数据**

无论是 “主 Worker 主动调用子 Worker 方法”，还是 “子 Worker 主动调用子 Worker 方法”，都是使用 Channel 的 `send` 方法。

```ts
send(methodName: string, data?: any, transfer?: ArrayBuffer[]) => Promise<any>
```

`send` 的第三个参数 `transfer` 则是持有 `data` 中包含需要移交控制权的 ArrayBuffer 对象，JWorker 会负责移交控制权。

```ts
// 发送方代码（此处为主 Worker ）
const uint8Array = await getContext(this).resourceManager.getRawFileContent("image1.jpeg")
const arrayBuffer = uint8Array.buffer
// 此处将 ArrayBuffer 的控制权移交给子 Worker ，所以将 ArrayBuffer 也放置到了第三个参数
// 值得注意，移交后的 ArrayBuffer ，主 Worker 不可再使用
const response = await this.simpleWorkerChannel.send("cropImage", arrayBuffer, [arrayBuffer]) as ArrayBuffer | undefined

// 接收方代码（此处为子 Worker ）
export class SubSimpleChannel extends Channel {
  async handleMessage(methodName: string, data: Any): Promise<Any> {
    switch (methodName) {
      case "cropImage": {
        // 接收 ArrayBuffer 的代码没有特别的要求，和接收普通类型的逻辑一样，只需要转为对应的类型进行处理即可
        const arrayBuffer = data as ArrayBuffer
        const cropPixelMap = await this.cropImage(arrayBuffer)
        const cropArrayBuffer = await PixelMapConverter.pixelMapToArrayBuffer(cropPixelMap)
        // 返回值如果需要移交 ArrayBuffer 控制权，则需要使用 TransferData 类进行包裹，具体使用看下一小节
        return new TransferData(cropArrayBuffer, [cropArrayBuffer])
      }
    }
  }
}
```

**返回值传递 ArrayBuffer 类型数据**

在处理完逻辑后，返回数据给调用方，此时存在返回数据携带 ArrayBuffer 类型数据的场景。为此 JWorker 提供了 `TransferData` 类型支持该场景数据的传递，具体操作如下：

```ts
// 继续上面的代码
// 接收方代码（此处为子 Worker ）
export class SubSimpleChannel extends Channel {
  async handleMessage(methodName: string, data: Any): Promise<Any> {
    switch (methodName) {
      case "cropImage": {
        // 省略重复代码
        // 返回值如果需要移交 ArrayBuffer 控制权，则需要使用 TransferData 类进行包裹
        // 第一个参数为返回数据，第二个参数则为需要移交控制权的 ArrayBuffer 列表
        return new TransferData(cropArrayBuffer, [cropArrayBuffer])
      }
    }
  }
}

// 发送方代码（此处为主 Worker ）
// 返回接收到的数据类型是已经去掉 TransferData 包裹的真实数据
const response = await this.simpleWorkerChannel.send("cropImage", arrayBuffer, [arrayBuffer]) as ArrayBuffer | undefined
if (response) {
  this.cropPixelMap = await PixelMapConverter.arrayBufferToPixelMap(response)
}
```

### 4、关闭 JWorker

在 JWorker 中提供了两种关闭 Worker 的方式，分别为 **主 Worker 进行关闭** 和 **子 Worker 进行关闭** 。可以按业务场景自行选择，但**更佳推荐子 Worker 进行关闭方式**，你可以控制好子 Worker 的生命周期和该释放的资源。

**主 Worker 进行关闭**

通过调用 `JWorker` 对象的 `release()` 方法进行释放。

```ts
// 创建 JWorker 对象
this.worker = createJWorker("sample/ets/worker/simple/SimpleWorker.ets")
// 进行开启 JWorker 、添加 Channel 等操作

// 关闭 JWorker
this.worker?.release()
```

**子 Worker 进行关闭**

通过调用 `SubWorker` 对象的 `release()` 方法进行释放。

```ts
// 在子 Worker 中构建 subWorker
const worker = initJWorker()
// 添加需要的 Channel 操作

// 在需要释放的时候调用
// 1、可以将 worker 传递给 Channel ，Channel 内部可以根据需要进行调用释放
// 2、可以全局持有，在需要的时候进行释放
worker.release()
```

### 5、值得注意

如果 `JWorker` 对象还未开启（还未调用 `JWorker.start()` 方法），使用添加在该的 Channel 进行发送消息会立马得到一个 `undefined` 类型数据。

通过  `JWorker` 的 Channel 发送了消息，但还未得到回复，此时对该 `JWorker` 进行关闭，则会让调用点立马得到 `undefined` 类型数据。

**所以为了程序的健壮，调用点的类型转换最好增加对 `undefined` 的判断。**

## 三、多个 Worker

### 1、项目父 Worker 开多个子 Worker

`JWorker` 项目支持开启多个 Worker ，使用 `createJWorker(workerPath: string)` 方法传入不同的路径，管理好返回 `JWorker` 对象即可。

![](https://github.com/zincPower/JWorker/blob/main/img/main_multi_worker.png)

项目需要构建上图的使用场景，可以通过以下代码创建 `JWorker` 实例。

- 可以使用不同的 Worker ets 文件，也可以使用同一个 Worker ets 文件可以开启多个 `JWorker` 实例。
- 通过管理好 `JWorker` 实例，添加渠道后进行各自 Worker 通讯，还可以通过项目主 Worker 让数据在多个子 Worker 流动。

```ts
// worker0 和 worker1、worker2 使用不同的 Worker ets 文件进行开启不同的 JWorker 实例
this.worker0 = createJWorker("sample/ets/worker/simple/SimpleWorker.ets")
this.worker0.start()
this.simpleWorkerChannel = new MainSimpleChannel()
this.worker0.addChannel("SimpleWorkerChannel", this.simpleWorkerChannel)

// worker1 和 worker2 使用相同的 Worker ets 文件进行开启不同的 JWorker 实例 
this.worker1 = createJWorker("sample/ets/worker/mainmultiworker/MainMultiWorker.ets")
this.worker1Channel = new MainMultiChannel()
this.worker1.addChannel("multiChannel", this.worker1Channel)
this.worker1.start()

this.worker2 = createJWorker("sample/ets/worker/mainmultiworker/MainMultiWorker.ets")
this.worker2Channel = new MainMultiChannel()
this.worker2.addChannel("multiChannel", this.worker2Channel)
this.worker2.start()
```

### 2、子 Worker 开多个子 Worker

`JWorker` 同样支持在子 Worker 开多个 Worker ，可以进行如下图所示的创建和管理。

![](https://github.com/zincPower/JWorker/blob/main/img/sub_multi_worker.png)

可以在子 Worker 需要创建更多子 Worker 的地方调用 `createJWorker` 创建 `JWorker` ，然后进行启动，后续添加 Channel 进行通讯即可。**使用方式和之前的完全一致。**

```ts
export class ParentSubChannel extends Channel {
  // 省略其他逻辑

  constructor(worker: SubWorker) {
    // 省略其他逻辑
    this.startChildrenWorker()
  }

  private startChildrenWorker() {
    if (this.childWorker1 == undefined) {
      this.childWorker1 = createJWorker("sample/ets/worker/submultiworker/ChildWorker.ets")
      this.childWorker1Channel = new ChildMainChannel()
      this.childWorker1.addChannel("childChannel", this.childWorker1Channel)
      this.childWorker1.start()
    }
    if (this.childWorker2 == undefined) {
      this.childWorker2 = createJWorker("sample/ets/worker/submultiworker/ChildWorker.ets")
      this.childWorker2Channel = new ChildMainChannel()
      this.childWorker2.addChannel("childChannel", this.childWorker2Channel)
      this.childWorker2.start()
    }
    if (this.childWorker3 == undefined) {
      this.childWorker3 = createJWorker("sample/ets/worker/submultiworker/ChildWorker.ets")
      this.childWorker3Channel = new ChildMainChannel()
      this.childWorker3.addChannel("childChannel", this.childWorker3Channel)
      this.childWorker3.start()
    }
  }
}
```

**值得注意**

这种情况下需要控制好 Worker 的关闭流程，应该让项目的主 Worker 通知子 Worker 进行关闭他创建的子 Worker ，然后在关闭自身。具体操作如下：

```ts
// 项目主 Worker 调用子 Worker 的 exit 方法
this.workerChannel?.send("exit")

// 子 Worker 接收到 exit 的调用，则调用子 Worker 创建的子 Worker 的 exit 进行退出，并等待所有的 Worker 处理完退出后，在退出自身
export class ParentSubChannel extends Channel {
  // 省略其他逻辑
  async handleMessage(methodName: string, data: Any) {
    switch (methodName) {
      case "exit": {
        // 等待所有子 Worker 的退出
        await Promise.all([this.childWorker1Channel?.send("exit"), this.childWorker2Channel?.send("exit"), this.childWorker3Channel?.send("exit")])
        Log.i(TAG, "【exit】")
        await this.worker?.release()
        this.worker = undefined
        this.childWorker1 = undefined
        this.childWorker1Channel = undefined
        this.childWorker2 = undefined
        this.childWorker2Channel = undefined
        this.childWorker3 = undefined
        this.childWorker3Channel = undefined
        return undefined
      }
      default: {
        return undefined
      }
    }
  }
}

// 子 Worker 的子 Worker 接收到 exit 的调用，退出自身
export class ChildSubChannel extends Channel {
  // 省略其他逻辑
  async handleMessage(methodName: string, data: Any) {
    if (methodName == "exit") {
      this.worker.release()
      return undefined
    }
    return undefined
  }
}
```

## 四、作者简介

### 1、个人博客

掘金：https://juejin.im/user/5c3033ef51882524ec3a88ba/posts

csdn：https://blog.csdn.net/weixin_37625173

公众号：微信搜索 "江澎涌" ，或扫描二维码

![](https://github.com/zincPower/JWorker/blob/main/img/officialaccount.png)

### 2、赞赏

如果觉得 JHandler 对你有帮助或启发，请我喝杯水果茶吧 😄

![](https://github.com/zincPower/JWorker/blob/main/img/pay.jpg)
