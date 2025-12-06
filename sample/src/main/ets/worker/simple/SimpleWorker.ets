import { Any, initJWorker, JWorkerChannel } from 'jworker'
import { SimpleWorkerChannel } from './SimpleWorkerChannel'

const worker = initJWorker()

const simpleWorkerChannel = new SimpleWorkerChannel(worker)

JWorkerChannel("SimpleWorkerChannel", async (methodName: string, data: Any) => simpleWorkerChannel.handleMessage(methodName, data))