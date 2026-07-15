import { LLMInferenceProvider } from './types';
import { RuleBasedProvider } from './providers/rule-based';
import { OpenAIProvider } from './providers/openai';

/**
 * Defaults to rule-based (no API key required) rather than openai, unlike
 * the original design — deliberate for now so the app works out of the
 * box; flip LLM_PROVIDER=openai once OPENAI_API_KEY is configured.
 */
export function createInferenceProvider(): LLMInferenceProvider {
  const provider = process.env.LLM_PROVIDER ?? 'rule-based';

  switch (provider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY not set');
      return new OpenAIProvider(key);
    }
    case 'rule-based':
      return new RuleBasedProvider();
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
  }
}
