// API Queue Manager to handle rate limiting and sequential requests
class APIQueueManager {
  private queue: Array<() => Promise<any>> = []
  private isProcessing = false
  private readonly delay = 1000 // 1 second delay between requests
  private readonly maxRetries = 3

  async addToQueue<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(apiCall)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.isProcessing) {
        this.processQueue()
      }
    })
  }

  private async executeWithRetry<T>(apiCall: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      const result = await apiCall()
      return result
    } catch (error: any) {
      console.error(`API call failed (attempt ${retryCount + 1}):`, error.message)

      if (retryCount < this.maxRetries && (error.message.includes("rate limit") || error.message.includes("429"))) {
        const backoffDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
        console.log(`Retrying in ${backoffDelay}ms...`)
        await this.sleep(backoffDelay)
        return this.executeWithRetry(apiCall, retryCount + 1)
      }

      throw error
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const apiCall = this.queue.shift()
      if (apiCall) {
        try {
          await apiCall()
        } catch (error) {
          console.error("Queue processing error:", error)
        }
        // Add delay between requests to avoid rate limiting
        if (this.queue.length > 0) {
          await this.sleep(this.delay)
        }
      }
    }

    this.isProcessing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    }
  }
}

export const apiQueue = new APIQueueManager()
