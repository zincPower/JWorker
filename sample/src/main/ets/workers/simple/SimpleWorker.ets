import { initJWorker, JWorkerChannel } from 'jworker'
import { SubSimpleChannel } from './channel/SubSimpleChannel'

const worker = initJWorker()

JWorkerChannel("SimpleWorkerChannel", new SubSimpleChannel(worker))