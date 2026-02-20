import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import { Step } from './planner';

const exec = util.promisify(cp.exec);

export class BuilderAgent {
    private _terminal: vscode.Terminal | undefined;

    constructor() {}

    /**
     * Executes a step's command in a VS Code terminal.
     * This allows the user to see the output and interact if necessary.
     */
    async executeStep(step: Step): Promise<boolean> {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal("BabyCoding Builder");
        }
        
        this._terminal.show();
        this._terminal.sendText(step.command);

        // For now, we assume success if the command is sent. 
        // Real verification would require parsing terminal output or running a verification command.
        // In v0.1, we rely on the user or a separate verification step.
        
        return true;
    }

    /**
     * Executes a command in the background and returns output.
     * Useful for verification steps.
     */
    async verifyStep(step: Step): Promise<{ success: boolean; output: string }> {
        if (!step.verification) {
            return { success: true, output: "No verification needed." };
        }

        try {
            // Execute in the workspace root if possible
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const cwd = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;
            
            const { stdout, stderr } = await exec(step.verification, { cwd });
            return { success: true, output: stdout || stderr };
        } catch (error: any) {
            return { success: false, output: error.message };
        }
    }
}
