import hilog from '@ohos.hilog'

class Logger {
  private domain = 0x1000
  isDebug = false

  d(tag: string, message: string): void {
    if (this.isDebug) {
      hilog.debug(this.domain, tag, message)
    }
  }

  i(tag: string, message: string): void {
    if (this.isDebug) {
      hilog.info(this.domain, tag, message)
    }
  }

  w(tag: string, message: string): void {
    if (this.isDebug) {
      hilog.warn(this.domain, tag, message)
    }
  }

  e(tag: string, message: string): void {
    if (this.isDebug) {
      hilog.error(this.domain, tag, message)
    }
  }
}

export const Log = new Logger()