import * as vscode from 'vscode';
import { BabyCodingPanel } from './panels/BabyCodingPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "baby-coding" is now active!');

    try {
        // Register the Webview View Provider
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
        
        console.log('BabyCoding: WebviewViewProvider registered for', BabyCodingPanel.viewType);

        let askSelectionDisposable = vscode.commands.registerCommand('babycoding.askSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                if (text) {
                    vscode.commands.executeCommand('babycoding-view.focus');
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
