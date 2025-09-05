/**
 * Centralized logging utility that respects environment settings
 * and prevents sensitive data exposure in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const config: LoggerConfig = {
  enableConsoleLogging: isDevelopment,
  enableRemoteLogging: false, // Set to true when implementing remote logging
  logLevel: isDevelopment ? 'debug' : 'error'
};

class Logger {
  private sanitizeData(data: any): any {
    if (!isDevelopment) {
      // In production, sanitize sensitive fields
      if (typeof data === 'object' && data !== null) {
        const sanitized = { ...data };
        
        // Remove or mask sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'connectionString'];
        
        for (const field of sensitiveFields) {
          if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
          }
        }
        
        // Sanitize URLs that might contain sensitive info
        if (sanitized.url && typeof sanitized.url === 'string') {
          // Only show domain for Azure blob URLs in production
          if (sanitized.url.includes('blob.core.windows.net')) {
            sanitized.url = '[AZURE_BLOB_URL]';
          }
        }
        
        // Sanitize image URLs
        if (sanitized.image && typeof sanitized.image === 'string') {
          if (sanitized.image.includes('blob.core.windows.net')) {
            sanitized.image = '[AZURE_BLOB_IMAGE]';
          }
        }
        
        return sanitized;
      }
    }
    
    return data;
  }

  debug(message: string, data?: any) {
    if (config.enableConsoleLogging && (config.logLevel === 'debug')) {
      console.log(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  info(message: string, data?: any) {
    if (config.enableConsoleLogging && ['debug', 'info'].includes(config.logLevel)) {
      console.info(`[INFO] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  warn(message: string, data?: any) {
    if (config.enableConsoleLogging && ['debug', 'info', 'warn'].includes(config.logLevel)) {
      console.warn(`[WARN] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  error(message: string, error?: any) {
    if (config.enableConsoleLogging) {
      console.error(`[ERROR] ${message}`, error ? this.sanitizeData(error) : '');
    }
    
    // In production, you might want to send errors to a logging service
    if (config.enableRemoteLogging && !isDevelopment) {
      // TODO: Implement remote logging service integration
    }
  }

  // Special method for user data - always sanitizes in production
  userAction(message: string, userData?: any) {
    if (isDevelopment) {
      console.log(`[USER] ${message}`, userData);
    } else {
      // In production, only log non-sensitive user actions
      console.log(`[USER] ${message}`);
    }
  }

  // Method for session/auth related logging
  auth(message: string, data?: any) {
    if (isDevelopment) {
      console.log(`[AUTH] ${message}`, data);
    } else {
      // In production, don't log auth data
      console.log(`[AUTH] ${message}`);
    }
  }
}

export const logger = new Logger();
export default logger;