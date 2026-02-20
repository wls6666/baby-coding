import OpenAI from 'openai';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
}

export interface LLMService {
    generate(messages: LLMMessage[]): Promise<LLMResponse>;
}

export class OpenAIProvider implements LLMService {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
        this.client = new OpenAI({ apiKey: apiKey });
        this.model = model;
    }

    async generate(messages: LLMMessage[]): Promise<LLMResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: messages as any,
                model: this.model,
            });

            return {
                content: completion.choices[0].message.content || ''
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('Failed to generate response from OpenAI');
        }
    }
}

// Mock Gemini Provider for now
export class GeminiProvider implements LLMService {
    private apiKey: string;
    
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(_messages: LLMMessage[]): Promise<LLMResponse> {
        // Placeholder for Gemini implementation
        return { content: "Gemini support coming soon!" };
    }
}

export class LLMFactory {
    static create(provider: 'openai' | 'gemini', apiKey: string): LLMService {
        switch (provider) {
            case 'openai':
                return new OpenAIProvider(apiKey);
            case 'gemini':
                return new GeminiProvider(apiKey);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }
}
