export type Reply = (data: any) => void

export type MethodCallHandler = (methodName: string, data: any) => Promise<any>

export type Any = null | undefined | {} | Function