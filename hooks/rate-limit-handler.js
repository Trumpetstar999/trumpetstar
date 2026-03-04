// Rate Limit Handler Hook for OpenClaw
// Handles HTTP 429 errors with exponential backoff and jitter

const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000,  // 1 second
  maxDelayMs: 60000,  // 60 seconds cap
  jitterMs: 1000,     // +/- 1 second
};

/**
 * Sleep with jitter
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise<void>}
 */
function sleepWithJitter(baseDelay) {
  const jitter = (Math.random() * 2 - 1) * RETRY_CONFIG.jitterMs; // +/- jitter
  const delay = Math.min(baseDelay + jitter, RETRY_CONFIG.maxDelayMs);
  return new Promise(resolve => setTimeout(resolve, Math.max(0, delay)));
}

/**
 * Check if error is a rate limit error (HTTP 429)
 * @param {Error} error
 * @returns {boolean}
 */
function isRateLimitError(error) {
  if (!error) return false;
  
  // HTTP 429 status code
  if (error.status === 429 || error.statusCode === 429) return true;
  
  // Error message patterns
  const rateLimitPatterns = [
    /rate.limit/i,
    /429/i,
    /too.many.requests/i,
    /throttl/i,
    /quota.exceeded/i,
    /rate_limit_error/i,
    /RateLimitError/i,
  ];
  
  const errorStr = error.message || error.toString();
  return rateLimitPatterns.some(pattern => pattern.test(errorStr));
}

/**
 * Execute a function with rate limit retry logic
 * @param {Function} fn - Function to execute
 * @param {string} operationName - Name for logging
 * @returns {Promise<any>}
 */
async function executeWithRetry(fn, operationName = 'operation') {
  let lastError;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if this is a rate limit error
      if (!isRateLimitError(error)) {
        // Not a rate limit error, throw immediately
        throw error;
      }
      
      // Last attempt failed, give up
      if (attempt === RETRY_CONFIG.maxRetries) {
        console.log(`[RateLimit] Max retries (${RETRY_CONFIG.maxRetries}) exceeded for ${operationName}`);
        break;
      }
      
      // Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s...
      const baseDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
      const delay = Math.min(baseDelay, RETRY_CONFIG.maxDelayMs);
      
      console.log(`[RateLimit] Attempt ${attempt + 1} failed for ${operationName}, retrying in ~${Math.round(delay/1000)}s...`);
      
      // Wait with jitter
      await sleepWithJitter(delay);
    }
  }
  
  // All retries exhausted
  const friendlyMessage = new Error(
    '⏳ The service is busy right now, please try again in a moment.'
  );
  friendlyMessage.originalError = lastError;
  friendlyMessage.isRateLimit = true;
  throw friendlyMessage;
}

// Export for use in other modules
module.exports = {
  executeWithRetry,
  isRateLimitError,
  RETRY_CONFIG,
};
