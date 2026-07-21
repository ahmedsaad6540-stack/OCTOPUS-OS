export class Logger {
  static info(message: string, ...optionalParams: any[]) {
    console.info(`[INFO] ${new Date().toISOString()}: ${message}`, ...optionalParams);
  }

  static warn(message: string, ...optionalParams: any[]) {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...optionalParams);
  }

  static error(message: string, error?: unknown, ...optionalParams: any[]) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error, ...optionalParams);
  }
}
