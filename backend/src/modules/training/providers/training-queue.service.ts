import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingQueueService {
  private readonly queue: string[] = [];

  enqueue(userId: string) {
    if (!this.queue.includes(userId)) {
      this.queue.push(userId);
    }
  }

  dequeue() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }

  hasItems() {
    return this.queue.length > 0;
  }

  clear() {
    this.queue.length = 0;
  }

  all() {
    return [...this.queue];
  }
}