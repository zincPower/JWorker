import hilog from '@ohos.hilog'

class Logger {
  private domain = 0x0000

  d(tag: string, message: string): void {
    hilog.debug(this.domain, tag, message)
  }

  i(tag: string, message: string): void {
    hilog.info(this.domain, tag, message)
  }

  w(tag: string, message: string): void {
    hilog.warn(this.domain, tag, message)
  }

  e(tag: string, message: string): void {
    hilog.error(this.domain, tag, message)
  }
}

export const Log = new Logger()