import { initJWorker, JWorkerChannel } from 'jworker'
import { SubSimpleChannel } from './SubSimpleChannel'

const worker = initJWorker()

JWorkerChannel("SimpleWorkerChannel", new SubSimpleChannel(worker))