// OpenClaw Hook: Rate Limit Retry Wrapper
// This hook wraps model calls with exponential backoff retry logic

const { executeWithRetry } = require('./rate-limit-handler');

/**
 * Hook entry point for wrapping model calls
 * @param {Object} ctx - OpenClaw context
 * @param {Function} next - Next handler in chain
 */
async function onModelCall(ctx, next) {
  // Wrap the model call with retry logic
  return await executeWithRetry(
    async () => {
      return await next();
    },
    `model:${ctx.model?.id || 'unknown'}`
  );
}

/**
 * Hook entry point for tool execution (also rate limited sometimes)
 * @param {Object} ctx - OpenClaw context  
 * @param {Function} next - Next handler in chain
 */
async function onToolCall(ctx, next) {
  // Only wrap external API calls, not local tools
  const externalTools = ['web_search', 'web_fetch', 'image'];
  if (!externalTools.includes(ctx.toolName)) {
    return await next();
  }
  
  return await executeWithRetry(
    async () => {
      return await next();
    },
    `tool:${ctx.toolName}`
  );
}

module.exports = {
  onModelCall,
  onToolCall,
};
