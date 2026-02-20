import * as vscode from 'vscode';
import { BabyCodingPanel } from './panels/BabyCodingPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('BabyCoding: activate() called - v0.3.0 FULL');
    vscode.window.showInformationMessage('BabyCoding v0.3.0: Ready to build!');

    // Initialize the Manager/Provider
    const provider = new BabyCodingPanel(context.extensionUri);

    // STRATEGY 1: Sidebar (Optional)
    // We register it, but we don't rely on it 100%
    try {
        const SIDEBAR_ID = 'babycoding-view-sidebar';
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(SIDEBAR_ID, provider)
        );
    } catch (e) {
        console.error('Sidebar registration failed (ignoring):', e);
    }

    // STRATEGY 2: Main Panel (Primary Entry)
    context.subscriptions.push(
        vscode.commands.registerCommand('babycoding.start', () => {
            // Create a panel
            const panel = vscode.window.createWebviewPanel(
                'babycoding-panel',
                'BabyCoding Board',
                vscode.ViewColumn.One,
                { enableScripts: true, retainContextWhenHidden: true }
            );
            
            // Connect logic to this panel
            provider.setupPanel(panel);
        })
    );

    // Context Menu Command
    context.subscriptions.push(
        vscode.commands.registerCommand('babycoding.askSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                if (text) {
                    // Try to use sidebar first, but if it's not there, user might need to run start first
                    // or we could auto-open panel. For now, try asking.
                    provider.ask(`Explain this code:\n\`\`\`\n${text}\n\`\`\``);
                } else {
                    vscode.window.showInformationMessage('Please select some code first.');
                }
            }
        })
    );
}

export function deactivate() {}
