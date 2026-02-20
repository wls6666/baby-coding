import { LLMService, LLMMessage } from '../services/llm';
import { Step } from './planner';

export class TutorAgent {
    constructor(private llmService: LLMService) {}

    /**
     * Explains what happened after a successful step.
     */
    async explainSuccess(step: Step): Promise<string> {
        const prompt = `
        You are a friendly coding tutor for absolute beginners.
        The user just successfully executed this step:
        Title: "${step.title}"
        Description: "${step.description}"
        Command: "${step.command}"

        Explain simply what this command did and why it's important. 
        Use an analogy if possible (e.g., "npm init is like creating a birth certificate for your project").
        Keep it short (2-3 sentences).
        `;

        const messages: LLMMessage[] = [
            { role: 'system', content: 'You are a helpful tutor. Explain simply in Chinese.' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await this.llmService.generate(messages);
            return response.content;
        } catch (error) {
            return "Great job! You completed this step. (做得好！你完成了这一步。)";
        }
    }

    /**
     * Explains an error and suggests a fix.
     */
    async explainError(step: Step, errorOutput: string): Promise<string> {
        const prompt = `
        You are a friendly coding tutor. The user encountered an error.
        Step: "${step.title}"
        Command: "${step.command}"
        Error Output: "${errorOutput}"

        1. Explain what the error means in simple terms (No technical jargon without explanation).
        2. Suggest a solution or the next command to try.
        `;

        const messages: LLMMessage[] = [
            { role: 'system', content: 'You are a helpful tutor. Explain errors simply in Chinese.' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await this.llmService.generate(messages);
            return response.content;
        } catch (error) {
            return "Something went wrong. Please check the error message in the terminal. (出错了，请检查终端的错误信息。)";
        }
    }
}
