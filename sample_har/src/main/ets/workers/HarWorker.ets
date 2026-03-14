import { initJWorker, JWorkerChannel } from 'jworker'
import { SubHarChannel } from './channel/SubSimpleChannel'

const worker = initJWorker()

JWorkerChannel("HarWorkerChannel", new SubHarChannel(worker))