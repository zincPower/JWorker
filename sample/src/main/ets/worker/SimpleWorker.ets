import { Any, initJWorker, JWorkerChannel } from 'jworker'
import { Log } from '../log/Log'

JWorkerChannel("SimpleWorkerChannel", async (methodName: string, data: Any) => {
  Log.i("SimpleWorkerChannel", `【handleMessage】methodName=${methodName} data=${data}`)
})

initJWorker()