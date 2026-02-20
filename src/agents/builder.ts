import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import { Step } from './planner';

const exec = util.promisify(cp.exec);

export class BuilderAgent {
    private _terminal: vscode.Terminal | undefined;

    constructor() {}

    private getTerminal(): vscode.Terminal {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal("BabyCoding Builder");
        }
        return this._terminal;
    }

    async executeStep(step: Step): Promise<void> {
        const terminal = this.getTerminal();
        terminal.show();
        terminal.sendText(step.command);
    }

    /**
     * Executes a command and captures output (Simulated for v0.2)
     * In a real extension, we would use a Task or a Node.js process to capture stdout/stderr.
     * For now, we rely on the user seeing the terminal.
     */
    async executeCommandWithOutput(command: string): Promise<{ success: boolean; output: string }> {
        // TODO: Implement actual output capture.
        // For v0.2, we will just run it in terminal.
        const terminal = this.getTerminal();
        terminal.sendText(command);
        return { success: true, output: "(Output visible in terminal)" };
    }

    /**
     * Executes a command in the background and returns output.
     * Useful for verification steps.
     */
    async verifyStep(step: any): Promise<{ success: boolean; output: string }> {
        if (!step.verification) {
            return { success: true, output: "No verification needed." };
        }

        try {
            // Execute in the workspace root if possible
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const cwd = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;
            
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);

            const { stdout, stderr } = await execPromise(step.verify, { cwd });
            return { success: true, output: stdout || stderr };
        } catch (error: any) {
            return { success: false, output: error.message };
        }
    }
}
