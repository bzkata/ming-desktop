import { spawn, ChildProcess } from 'child_process';
import nodeProcess from 'process';
import { Logger } from '../utils/Logger';
import { ConfigManager } from './ConfigManager';
import { ExecutionResult } from '../../shared/types';

export class ExecutorService {
  private activeProcesses: Map<string, ChildProcess> = new Map();

  constructor(private configManager: ConfigManager) {}

  async initialize(): Promise<void> {
    Logger.info('Initializing Executor Service...');
  }

  async executeCommand(
    command: string,
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { cwd, env, timeout = 30000 } = options;

    return new Promise((resolve, reject) => {
      Logger.info(`Executing command: ${command}`);

      const [cmd, ...args] = command.split(' ');
      const childProcess = spawn(cmd, args, {
        cwd,
        env: { ...nodeProcess.env, ...env },
        shell: true
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        childProcess.kill();
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      childProcess.on('close', (code) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;

        const result: ExecutionResult = {
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          duration
        };

        Logger.info(`Command completed: ${command} (exit: ${code}, duration: ${duration}ms)`);
        resolve(result);
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeoutHandle);
        Logger.error('Command execution error:', error);
        reject(error);
      });
    });
  }

  async executeScript(
    script: string,
    args: any = {}
  ): Promise<any> {
    // 这里可以实现 Python 脚本执行、Node.js 脚本执行等
    Logger.info(`Executing script: ${script}`);

    // 示例：执行 Python 脚本
    const command = `python3 ${script}`;
    const result = await this.executeCommand(command, {
      env: {
        ...nodeProcess.env,
        ...args
      }
    });

    if (!result.success) {
      throw new Error(result.stderr);
    }

    // 尝试解析 JSON 输出
    try {
      return JSON.parse(result.stdout);
    } catch {
      return result.stdout;
    }
  }

  async executeCommandInBackground(
    command: string,
    options: {
      cwd?: string;
      env?: Record<string, string>;
      name?: string;
    } = {}
  ): Promise<string> {
    const { cwd, env, name = `process-${Date.now()}` } = options;

    Logger.info(`Starting background process: ${command} (name: ${name})`);

    const [cmd, ...args] = command.split(' ');
    const childProcess = spawn(cmd, args, {
      cwd,
      env: { ...nodeProcess.env, ...env },
      shell: true,
      detached: true
    });

    this.activeProcesses.set(name, childProcess);
    this.emit('process-started', { name, pid: childProcess.pid });

    return name;
  }

  async stopProcess(name: string): Promise<void> {
    const process = this.activeProcesses.get(name);
    if (process) {
      process.kill();
      this.activeProcesses.delete(name);
      this.emit('process-stopped', { name });
      Logger.info(`Background process stopped: ${name}`);
    }
  }

  listActiveProcesses(): string[] {
    return Array.from(this.activeProcesses.keys());
  }

  on(event: string, callback: (...args: any[]) => void): void {
    // 简化的事件监听实现
  }

  emit(event: string, data: any): void {
    // 简化的事件触发实现
  }
}
