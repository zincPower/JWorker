import { initJWorker, JWorkerChannel } from 'jworker'
import { ChildSubChannel } from './channel/ChildSubChannel'

const worker = initJWorker()

JWorkerChannel("childChannel", new ChildSubChannel(worker))