import * as vscode from 'vscode';
import { BabyCodingPanel } from './panels/BabyCodingPanel';

console.log('BabyCoding: Extension file is loading...');

export function activate(context: vscode.ExtensionContext) {
    console.log('BabyCoding: activate() called');
    vscode.window.showInformationMessage('BabyCoding: Extension Activating...');

    try {
        const VIEW_ID = 'babycoding-view';
        console.log('BabyCoding: Registering provider for', VIEW_ID);
        
        const provider = new BabyCodingPanel(context.extensionUri);
        
        const registration = vscode.window.registerWebviewViewProvider(
            VIEW_ID, 
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true }
            }
        );
        // Explicitly add to subscriptions immediately
        context.subscriptions.push(registration);
        
        // Force provider to resolve (hack for stubborn views)
        // This triggers the resolveWebviewView method manually if VS Code missed it
        // (Note: we can't really force resolveWebviewView from outside, 
        // but we can ensure the object is alive)
        
        console.log('BabyCoding: WebviewViewProvider registered successfully');
        vscode.window.showInformationMessage('BabyCoding: Ready!');

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
