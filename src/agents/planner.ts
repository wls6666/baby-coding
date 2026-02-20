import { LLMService, LLMMessage } from '../services/llm';

export interface ProjectPlan {
    id: string;
    title: string;
    goal: string;
    steps: Step[];
    status: 'planning' | 'active' | 'completed';
}

export interface Step {
    id: string;
    title: string;
    description: string;
    command: string; // The command to execute
    verification: string; // Command to verify success
    terms: Term[]; // Educational terms involved
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
    error?: string;
}

export interface Term {
    name: string;
    definition: string;
}

export class PlannerAgent {
    constructor(private llmService: LLMService) {}

    async createPlan(userIdea: string): Promise<ProjectPlan> {
        const prompt = `
        You are a senior software architect designed to help absolute beginners build projects.
        The user wants to build: "${userIdea}".
        
        Create a step-by-step plan to build this project.
        The plan MUST be broken down into small, executable steps.
        Each step should involve running a command or writing code.
        
        Output a valid JSON object matching this schema:
        {
            "id": "unique_id",
            "title": "Project Title",
            "goal": "Project Goal",
            "steps": [
                {
                    "id": "step_1",
                    "title": "Step Title",
                    "description": "Simple explanation of what this step does",
                    "command": "The exact shell command to run (e.g., 'npm init -y' or 'echo \"code\" > file.js')",
                    "verification": "A command to verify it worked (e.g., 'ls' or 'cat file.js')",
                    "terms": [
                        { "name": "Term Name", "definition": "Simple explanation for a 5-year-old" }
                    ],
                    "status": "pending"
                }
            ],
            "status": "planning"
        }

        IMPORTANT:
        - Use simple, standard tools (HTML/JS for web, Python for scripts).
        - Assume the user is on Windows/Mac/Linux (use cross-platform commands if possible, or prioritize common ones).
        - If creating a file, use 'echo' or similar to write content. For complex files, break it down.
        - Keep it simple! 3-5 steps for a first version.
        `;

        const messages: LLMMessage[] = [
            { role: 'system', content: 'You are a JSON generator. You only output valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await this.llmService.generate(messages);
            const jsonContent = this._extractJson(response.content);
            return JSON.parse(jsonContent) as ProjectPlan;
        } catch (error) {
            console.error("Failed to generate plan:", error);
            throw new Error("Failed to generate a valid plan. Please try again.");
        }
    }

    private _extractJson(text: string): string {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? match[0] : text;
    }
}
