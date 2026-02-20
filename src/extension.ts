import * as vscode from 'vscode';

// Inline Simple Provider to debug registration issues
class SimpleProvider implements vscode.WebviewViewProvider {
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        console.log('SimpleProvider.resolveWebviewView called');
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>body{font-family:sans-serif;padding:10px;}</style>
            </head>
            <body>
                <h1>✅ SUCCESS!</h1>
                <p>The View Provider is working.</p>
                <p>BabyCoding ID: baby-coding-debug</p>
                <p>Version: 0.0.2</p>
                <p>Time: ${new Date().toLocaleTimeString()}</p>
            </body>
            </html>
        `;
    }
}

console.log('BabyCoding: Extension file LOADED (Top Level)');

export function activate(context: vscode.ExtensionContext) {
    console.log('BabyCoding: activate() called - v0.0.2 DEBUG');
    vscode.window.showInformationMessage('BabyCoding DEBUG: Extension Loaded!');

    // Register a simple Hello World command to verify basic functionality
    context.subscriptions.push(
        vscode.commands.registerCommand('babycoding.hello', () => {
            vscode.window.showInformationMessage('Hello from BabyCoding Debug!');
        })
    );

    try {
        const VIEW_ID = 'babycoding-view';
        console.log(`BabyCoding: Registering SimpleProvider for ${VIEW_ID}`);
        
        const provider = new SimpleProvider();
        
        const registration = vscode.window.registerWebviewViewProvider(
            VIEW_ID, 
            provider,
            { webviewOptions: { retainContextWhenHidden: true } }
        );
        
        context.subscriptions.push(registration);
        console.log('BabyCoding: Provider Registered');

    } catch (e) {
        console.error('BabyCoding Provider Error:', e);
        vscode.window.showErrorMessage(`Provider Error: ${e}`);
    }
}

export function deactivate() {}
