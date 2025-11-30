import { Any, initJWorker, ServerChannel } from 'jworker'
import { Log } from '../log/Log'

ServerChannel("SimpleWorkerChannel", async (methodName: string, data: Any) => {
  Log.i("SimpleWorkerChannel", `【handleMessage】methodName=${methodName} data=${data}`)
})

initJWorker()