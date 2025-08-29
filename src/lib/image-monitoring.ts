"use client";

interface ImageLoadFailure {
  url: string;
  alt: string;
  timestamp: string;
  userAgent: string;
  retryCount: number;
  errorType: 'timeout' | 'network' | 'not-found' | 'server-error' | 'unknown';
  isAzureUrl: boolean;
  userId?: string;
  sessionId?: string;
}

interface ImageLoadMetrics {
  totalLoads: number;
  failures: number;
  azureFailures: number;
  successRate: number;
  averageRetryCount: number;
  recentFailures: ImageLoadFailure[];
}

class ImageMonitoringService {
  private failures: ImageLoadFailure[] = [];
  private metrics: ImageLoadMetrics = {
    totalLoads: 0,
    failures: 0,
    azureFailures: 0,
    successRate: 100,
    averageRetryCount: 0,
    recentFailures: []
  };

  // Maximum number of failures to keep in memory
  private readonly MAX_FAILURES = 100;

  constructor() {
    // Try to restore data from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('imageMonitoring');
      if (stored) {
        const data = JSON.parse(stored);
        this.failures = data.failures || [];
        this.metrics = { ...this.metrics, ...data.metrics };
      }
    } catch (error) {
      console.warn('Failed to load image monitoring data from storage:', error);
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('imageMonitoring', JSON.stringify({
          failures: this.failures.slice(-this.MAX_FAILURES),
          metrics: this.metrics
        }));
      } catch (error) {
        console.warn('Failed to save image monitoring data to storage:', error);
      }
    }
  }

  private isAzureUrl(url: string): boolean {
    return url.includes('blob.core.windows.net') || url.includes('societyplus.blob.core.windows.net');
  }

  private getErrorType(error: any): ImageLoadFailure['errorType'] {
    if (!error) return 'unknown';
    
    const errorString = error.toString().toLowerCase();
    
    if (errorString.includes('timeout')) return 'timeout';
    if (errorString.includes('network')) return 'network';
    if (errorString.includes('404') || errorString.includes('not found')) return 'not-found';
    if (errorString.includes('50') || errorString.includes('server')) return 'server-error';
    
    return 'unknown';
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from session or local storage
    try {
      if (typeof window !== 'undefined') {
        const session = localStorage.getItem('session');
        if (session) {
          const parsed = JSON.parse(session);
          return parsed.user?.id;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return undefined;
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('imageMonitoringSessionId');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('imageMonitoringSessionId', sessionId);
      }
      return sessionId;
    }
    return 'unknown';
  }

  // Log a successful image load
  logSuccess(url: string) {
    this.metrics.totalLoads++;
    this.updateSuccessRate();
  }

  // Log a failed image load
  logFailure(url: string, alt: string, retryCount: number = 0, error?: any) {
    const failure: ImageLoadFailure = {
      url,
      alt,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      retryCount,
      errorType: this.getErrorType(error),
      isAzureUrl: this.isAzureUrl(url),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };

    this.failures.push(failure);
    this.metrics.failures++;
    this.metrics.totalLoads++;
    
    if (failure.isAzureUrl) {
      this.metrics.azureFailures++;
    }

    // Keep only recent failures in memory
    if (this.failures.length > this.MAX_FAILURES) {
      this.failures = this.failures.slice(-this.MAX_FAILURES);
    }

    this.metrics.recentFailures = this.failures.slice(-10); // Last 10 failures
    this.updateSuccessRate();
    this.updateAverageRetryCount();

    // Log to console for debugging
    console.group('🚨 Image Load Failure Detected');
    console.log('URL:', url);
    console.log('Error Type:', failure.errorType);
    console.log('Retry Count:', retryCount);
    console.log('Is Azure URL:', failure.isAzureUrl);
    console.log('Current Success Rate:', this.metrics.successRate.toFixed(2) + '%');
    console.groupEnd();

    // Save to storage
    this.saveToStorage();

    // Send to analytics if available
    this.sendToAnalytics(failure);
  }

  private updateSuccessRate() {
    if (this.metrics.totalLoads > 0) {
      this.metrics.successRate = ((this.metrics.totalLoads - this.metrics.failures) / this.metrics.totalLoads) * 100;
    }
  }

  private updateAverageRetryCount() {
    if (this.failures.length > 0) {
      const totalRetries = this.failures.reduce((sum, failure) => sum + failure.retryCount, 0);
      this.metrics.averageRetryCount = totalRetries / this.failures.length;
    }
  }

  private sendToAnalytics(failure: ImageLoadFailure) {
    // Send to your preferred analytics service
    // This is a placeholder for integration with services like:
    // - Google Analytics
    // - Mixpanel
    // - Custom logging endpoint
    
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Google Analytics 4 example
      (window as any).gtag('event', 'image_load_failure', {
        custom_map: {
          url: failure.url,
          error_type: failure.errorType,
          is_azure: failure.isAzureUrl,
          retry_count: failure.retryCount
        }
      });
    }

    // You could also send to a custom endpoint:
    // fetch('/api/analytics/image-failures', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(failure)
    // }).catch(() => {}); // Ignore analytics failures
  }

  // Get current metrics
  getMetrics(): ImageLoadMetrics {
    return { ...this.metrics };
  }

  // Get recent failures
  getRecentFailures(limit: number = 10): ImageLoadFailure[] {
    return this.failures.slice(-limit);
  }

  // Get failures for a specific URL pattern
  getFailuresForUrl(urlPattern: string): ImageLoadFailure[] {
    return this.failures.filter(failure => 
      failure.url.includes(urlPattern)
    );
  }

  // Get Azure-specific failures
  getAzureFailures(): ImageLoadFailure[] {
    return this.failures.filter(failure => failure.isAzureUrl);
  }

  // Check if we should alert about high failure rate
  shouldAlert(): boolean {
    const recentFailures = this.failures.filter(failure => {
      const failureTime = new Date(failure.timestamp);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return failureTime > fiveMinutesAgo;
    });

    // Alert if more than 3 failures in last 5 minutes
    return recentFailures.length > 3;
  }

  // Get failure patterns
  getFailurePatterns() {
    const patterns: { [key: string]: number } = {};
    
    this.failures.forEach(failure => {
      const pattern = failure.errorType;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  // Export data for debugging
  exportData() {
    return {
      metrics: this.metrics,
      failures: this.failures,
      patterns: this.getFailurePatterns(),
      azureFailures: this.getAzureFailures().length,
      shouldAlert: this.shouldAlert()
    };
  }

  // Clear all data (useful for testing)
  clearData() {
    this.failures = [];
    this.metrics = {
      totalLoads: 0,
      failures: 0,
      azureFailures: 0,
      successRate: 100,
      averageRetryCount: 0,
      recentFailures: []
    };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('imageMonitoring');
      sessionStorage.removeItem('imageMonitoringSessionId');
    }
  }
}

// Export singleton instance
export const imageMonitoring = new ImageMonitoringService();

// Export types for use in components
export type { ImageLoadFailure, ImageLoadMetrics };

// Utility function to check Azure Blob Storage health
export async function checkAzureHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
  const start = Date.now();
  
  try {
    // Use a small known image for health check
    const healthCheckUrl = 'https://societyplus.blob.core.windows.net/media/health-check.png';
    
    const response = await fetch(healthCheckUrl, {
      method: 'HEAD', // Only check if the resource exists
      cache: 'no-cache'
    });
    
    const responseTime = Date.now() - start;
    
    return {
      healthy: response.ok,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}