import * as vscode from 'vscode';
import { BabyCodingPanel } from './panels/BabyCodingPanel';

console.log('BabyCoding: Extension file is loading...');

export function activate(context: vscode.ExtensionContext) {
    console.log('BabyCoding: activate() called');
    vscode.window.showInformationMessage('BabyCoding: Extension Activating...');

    try {
        // Register the Webview View Provider
        console.log('BabyCoding: Registering provider for', BabyCodingPanel.viewType);
        const provider = new BabyCodingPanel(context.extensionUri);
        
        // Ensure the registration is pushed to subscriptions immediately
        const registration = vscode.window.registerWebviewViewProvider(
            BabyCodingPanel.viewType, 
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true }
            }
        );
        context.subscriptions.push(registration);
        
        console.log('BabyCoding: WebviewViewProvider registered successfully');
        vscode.window.showInformationMessage('BabyCoding: Ready!');

        let askSelectionDisposable = vscode.commands.registerCommand('babycoding.askSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                if (text) {
                    vscode.commands.executeCommand('babycoding-view-v2.focus');
                    provider.ask(`Explain this code:\n\`\`\`\n${text}\n\`\`\``);
                } else {
                    vscode.window.showInformationMessage('Please select some code first.');
                }
            }
        });
        context.subscriptions.push(askSelectionDisposable);

        let startDisposable = vscode.commands.registerCommand('babycoding.start', () => {
            vscode.window.showInformationMessage('BabyCoding: Let\'s build something!');
        });
        
        let setupDisposable = vscode.commands.registerCommand('babycoding.setup', () => {
            // Logic for setup wizard
            vscode.window.showInformationMessage('BabyCoding: Starting Setup Wizard...');
        });

        context.subscriptions.push(startDisposable);
        context.subscriptions.push(setupDisposable);
    } catch (error) {
        console.error('Extension activation failed:', error);
        vscode.window.showErrorMessage(`BabyCoding failed to activate: ${error}`);
    }
}

export function deactivate() {}
