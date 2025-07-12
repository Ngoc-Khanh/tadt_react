// Performance testing utilities for file upload system
// Dùng để test và benchmark performance improvements

interface PerformanceMetrics {
  fileSize: number
  fileName: string
  startTime: number
  endTime: number
  processingTime: number
  memoryUsage: {
    before: number
    after: number
    peak: number
  }
  stages: {
    validation: number
    parsing: number
    processing: number
    completion: number
  }
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private memoryObserver: PerformanceObserver | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.setupMemoryObserver()
    }
  }

  private setupMemoryObserver() {
    try {
      if (PerformanceObserver) {
        this.memoryObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            console.log(`[PerformanceMonitor] ${entry.name}: ${entry.duration}ms`)
          })
        })
        this.memoryObserver.observe({ type: 'measure', buffered: true })
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Performance observer not supported:', error)
    }
  }

  startMonitoring(fileId: string, fileName: string, fileSize: number) {
    const startTime = performance.now()
    const initialMemory = this.getCurrentMemoryUsage()

    this.metrics.set(fileId, {
      fileSize,
      fileName,
      startTime,
      endTime: 0,
      processingTime: 0,
      memoryUsage: {
        before: initialMemory,
        after: 0,
        peak: initialMemory
      },
      stages: {
        validation: 0,
        parsing: 0,
        processing: 0,
        completion: 0
      }
    })

    console.log(`[PerformanceMonitor] Started monitoring ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`)
  }

  updateStage(fileId: string, stage: keyof PerformanceMetrics['stages']) {
    const metric = this.metrics.get(fileId)
    if (metric) {
      metric.stages[stage] = performance.now() - metric.startTime
      this.updatePeakMemory(fileId)
    }
  }

  stopMonitoring(fileId: string): PerformanceMetrics | null {
    const metric = this.metrics.get(fileId)
    if (!metric) return null

    metric.endTime = performance.now()
    metric.processingTime = metric.endTime - metric.startTime
    metric.memoryUsage.after = this.getCurrentMemoryUsage()

    const result = { ...metric }
    this.metrics.delete(fileId)

    console.log(`[PerformanceMonitor] Completed monitoring ${metric.fileName}:`, {
      processingTime: `${metric.processingTime.toFixed(2)}ms`,
      memoryDelta: `${(metric.memoryUsage.after - metric.memoryUsage.before).toFixed(2)}MB`,
      throughput: `${(metric.fileSize / metric.processingTime * 1000 / 1024 / 1024).toFixed(2)}MB/s`
    })

    return result
  }

  private updatePeakMemory(fileId: string) {
    const metric = this.metrics.get(fileId)
    if (metric) {
      const currentMemory = this.getCurrentMemoryUsage()
      metric.memoryUsage.peak = Math.max(metric.memoryUsage.peak, currentMemory)
    }
  }

  private getCurrentMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perf = window.performance as Performance & {
        memory?: {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
      }
      return perf.memory?.usedJSHeapSize ? perf.memory.usedJSHeapSize / 1024 / 1024 : 0
    }
    return 0
  }

  generateReport(): string {
    const allMetrics = Array.from(this.metrics.values())
    if (allMetrics.length === 0) return 'No performance data available'

    const totalFiles = allMetrics.length
    const totalSize = allMetrics.reduce((sum, m) => sum + m.fileSize, 0)
    const averageProcessingTime = allMetrics.reduce((sum, m) => sum + m.processingTime, 0) / totalFiles
    const totalMemoryUsage = allMetrics.reduce((sum, m) => sum + (m.memoryUsage.after - m.memoryUsage.before), 0)

    return `
Performance Report:
==================
Total Files: ${totalFiles}
Total Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB
Average Processing Time: ${averageProcessingTime.toFixed(2)}ms
Total Memory Usage: ${totalMemoryUsage.toFixed(2)}MB
Average Throughput: ${(totalSize / (averageProcessingTime * totalFiles) * 1000 / 1024 / 1024).toFixed(2)}MB/s

Stage Breakdown:
- Validation: ${allMetrics.reduce((sum, m) => sum + m.stages.validation, 0) / totalFiles}ms avg
- Parsing: ${allMetrics.reduce((sum, m) => sum + m.stages.parsing, 0) / totalFiles}ms avg  
- Processing: ${allMetrics.reduce((sum, m) => sum + m.stages.processing, 0) / totalFiles}ms avg
- Completion: ${allMetrics.reduce((sum, m) => sum + m.stages.completion, 0) / totalFiles}ms avg
    `
  }
}

// Test scenarios for different file sizes and types
export const performanceTestScenarios = {
  // Small files (< 1MB)
  smallFiles: {
    name: 'Small Files Test',
    description: 'Test with multiple small KML files',
    fileCount: 10,
    maxSize: 1024 * 1024,
    expectedTime: 5000 // 5 seconds
  },

  // Medium files (1-10MB)
  mediumFiles: {
    name: 'Medium Files Test', 
    description: 'Test with medium-sized KML/KMZ files',
    fileCount: 5,
    maxSize: 10 * 1024 * 1024,
    expectedTime: 15000 // 15 seconds
  },

  // Large files (10-50MB)
  largeFiles: {
    name: 'Large Files Test',
    description: 'Test with large KML/KMZ files',
    fileCount: 2,
    maxSize: 50 * 1024 * 1024,
    expectedTime: 30000 // 30 seconds
  },

  // Concurrent upload test
  concurrentUpload: {
    name: 'Concurrent Upload Test',
    description: 'Test multiple files uploading simultaneously',
    fileCount: 8,
    maxSize: 5 * 1024 * 1024,
    expectedTime: 20000 // 20 seconds
  }
}

// Benchmark comparison utilities
export const benchmarkComparison = {
  // Before optimization benchmarks (example data)
  beforeOptimization: {
    smallFiles: { averageTime: 2000, memoryUsage: 50 },
    mediumFiles: { averageTime: 8000, memoryUsage: 200 },
    largeFiles: { averageTime: 25000, memoryUsage: 500 },
    uiBlocking: true,
    concurrentProcessing: false
  },

  // After optimization targets
  afterOptimization: {
    smallFiles: { averageTime: 1000, memoryUsage: 30 },
    mediumFiles: { averageTime: 4000, memoryUsage: 100 },
    largeFiles: { averageTime: 12000, memoryUsage: 250 },
    uiBlocking: false,
    concurrentProcessing: true
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Helper function to run performance tests
export const runPerformanceTest = async (scenario: keyof typeof performanceTestScenarios) => {
  const test = performanceTestScenarios[scenario]
  console.log(`[PerformanceTest] Running ${test.name}...`)
  console.log(`[PerformanceTest] ${test.description}`)
  
  const startTime = performance.now()
  
  // This would be implemented with actual file upload testing
  // For now, we just log the test scenario
  console.log(`[PerformanceTest] Testing ${test.fileCount} files up to ${(test.maxSize / 1024 / 1024).toFixed(2)}MB each`)
  console.log(`[PerformanceTest] Expected completion time: ${test.expectedTime}ms`)
  
  const endTime = performance.now()
  console.log(`[PerformanceTest] Test setup completed in ${(endTime - startTime).toFixed(2)}ms`)
  
  return {
    scenario,
    setupTime: endTime - startTime,
    expectedTime: test.expectedTime,
    fileCount: test.fileCount,
    maxSize: test.maxSize
  }
}

// Usage example:
// import { performanceMonitor, runPerformanceTest } from './utils/performanceTest'
// 
// // Start monitoring a file
// performanceMonitor.startMonitoring('file-123', 'test.kml', 1024000)
// 
// // Update stages during processing
// performanceMonitor.updateStage('file-123', 'validation')
// performanceMonitor.updateStage('file-123', 'parsing')
// performanceMonitor.updateStage('file-123', 'processing')
// performanceMonitor.updateStage('file-123', 'completion')
// 
// // Stop monitoring and get results
// const results = performanceMonitor.stopMonitoring('file-123')
// 
// // Run a performance test
// runPerformanceTest('smallFiles') 