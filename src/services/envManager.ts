import * as cp from 'child_process';
import * as os from 'os';
import * as util from 'util';
import * as vscode from 'vscode';

const exec = util.promisify(cp.exec);

export interface EnvStatus {
    git: boolean;
    node: boolean;
    python: boolean;
    gitVersion?: string;
    nodeVersion?: string;
    pythonVersion?: string;
}

export class EnvManager {
    
    /**
     * Checks the current environment status.
     */
    static async checkEnvironment(): Promise<EnvStatus> {
        const status: EnvStatus = {
            git: false,
            node: false,
            python: false
        };

        try {
            const { stdout } = await exec('git --version');
            status.git = true;
            status.gitVersion = stdout.trim();
        } catch {}

        try {
            const { stdout } = await exec('node -v');
            status.node = true;
            status.nodeVersion = stdout.trim();
        } catch {}

        try {
            // Check python or python3
            try {
                const { stdout } = await exec('python --version');
                status.python = true;
                status.pythonVersion = stdout.trim();
            } catch {
                const { stdout } = await exec('python3 --version');
                status.python = true;
                status.pythonVersion = stdout.trim();
            }
        } catch {}

        return status;
    }

    /**
     * Generates installation commands based on the OS.
     */
    static getInstallCommands(missing: string[]): string[] {
        const platform = os.platform();
        const commands: string[] = [];

        if (platform === 'win32') {
            // Windows using winget
            if (missing.includes('git')) commands.push('winget install -e --id Git.Git');
            if (missing.includes('node')) commands.push('winget install -e --id OpenJS.NodeJS');
            if (missing.includes('python')) commands.push('winget install -e --id Python.Python.3');
        } else if (platform === 'darwin') {
            // macOS using brew
            // Check if brew exists first? Assuming brew for now as standard
            commands.push('echo "Checking for Homebrew..."'); // Placeholder
            if (missing.includes('git')) commands.push('brew install git');
            if (missing.includes('node')) commands.push('brew install node');
            if (missing.includes('python')) commands.push('brew install python');
        } else {
            // Linux (assuming apt for simplicity, can be expanded)
            if (missing.includes('git')) commands.push('sudo apt-get update && sudo apt-get install -y git');
            if (missing.includes('node')) commands.push('sudo apt-get install -y nodejs npm');
            if (missing.includes('python')) commands.push('sudo apt-get install -y python3 python3-pip');
        }

        return commands;
    }
}
