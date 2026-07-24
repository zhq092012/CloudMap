export interface WorkerTaskEnvelope<T> {
  id: number;
  payload: T;
}

export interface WorkerResultEnvelope<T> {
  id: number;
  result?: T;
  error?: string;
}

/**
 * Worker 任务客户端。
 *
 * 作用：
 * 1. 把多次 postMessage 包装成 Promise 风格
 * 2. 通过 id 匹配请求与响应
 * 3. 支持超时与统一资源清理
 */
export class WorkerTaskClient<TReq, TRes> {
  private worker: Worker;
  private seq = 0;
  private pending = new Map<number, { resolve: (value: TRes) => void; reject: (reason?: unknown) => void }>();

  constructor(worker: Worker) {
    this.worker = worker;

    this.worker.onmessage = (event: MessageEvent<WorkerResultEnvelope<TRes>>) => {
      const data = event.data;
      const task = this.pending.get(data.id);
      if (!task) {
        return;
      }
      this.pending.delete(data.id);

      if (data.error) {
        task.reject(new Error(data.error));
        return;
      }

      task.resolve(data.result as TRes);
    };

    this.worker.onerror = (error) => {
      this.pending.forEach((task) => task.reject(error));
      this.pending.clear();
    };
  }

  request(payload: TReq, timeoutMs = 2000): Promise<TRes> {
    const id = ++this.seq;
    const envelope: WorkerTaskEnvelope<TReq> = { id, payload };

    return new Promise<TRes>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(envelope);

      if (timeoutMs <= 0) {
        return;
      }

      window.setTimeout(() => {
        if (!this.pending.has(id)) {
          return;
        }
        this.pending.delete(id);
        reject(new Error(`Worker 任务超时: ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  dispose(): void {
    this.worker.terminate();
    this.pending.forEach((task) => task.reject(new Error("Worker 已销毁")));
    this.pending.clear();
  }
}
