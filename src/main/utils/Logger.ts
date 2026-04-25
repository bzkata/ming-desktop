import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  private static logFile: string | null = null;

  static initialize(): void {
    // 设置日志文件路径
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `hermes-${date}.log`);

    this.info('Logger initialized');
  }

  static setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private static formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${args.map(a => JSON.stringify(a)).join(' ')}` : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  private static writeToFile(message: string): void {
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, message + '\n');
      } catch (error) {
        // 忽略写入错误，避免无限递归
      }
    }
  }

  static debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, ...args);
      console.debug(formatted);
      this.writeToFile(formatted);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, ...args);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, ...args);
      console.warn(formatted);
      this.writeToFile(formatted);
    }
  }

  static error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, ...args);
      console.error(formatted);
      this.writeToFile(formatted);
    }
  }
}
