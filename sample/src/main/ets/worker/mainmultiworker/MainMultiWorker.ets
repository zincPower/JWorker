import { initJWorker, JWorkerChannel } from 'jworker'
import { SubMultiChannel } from './channel/SubMultiChannel'

const worker = initJWorker()

JWorkerChannel("multiChannel", new SubMultiChannel())