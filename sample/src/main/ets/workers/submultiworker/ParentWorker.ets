import { initJWorker, JWorkerChannel } from 'jworker'
import { ParentSubChannel } from './channel/ParentSubChannel'

const worker = initJWorker()

JWorkerChannel("parentChannel", new ParentSubChannel(worker))