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
                <h1>BabyCoding Debug v0.2.95</h1>
                <p>✅ View Provider Registered Successfully!</p>
                <p>If you can see this, the core connection is working.</p>
                <p>Time: ${new Date().toLocaleTimeString()}</p>
            </body>
            </html>
        `;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('BabyCoding: activate() called - v0.2.95');
    // Show a message immediately to confirm activation
    vscode.window.showInformationMessage('BabyCoding: v0.2.95 Activating...');

    try {
        const VIEW_ID = 'babycoding-view';
        console.log(`BabyCoding: Registering SimpleProvider for ${VIEW_ID}`);
        
        // Make provider persistent by assigning to a module-level variable or global
        const provider = new SimpleProvider();
        
        // Pass context to subscription to ensure it lives as long as the extension
        const registration = vscode.window.registerWebviewViewProvider(
            VIEW_ID, 
            provider,
            { webviewOptions: { retainContextWhenHidden: true } }
        );
        
        context.subscriptions.push(registration);
        
        // Add a secondary command to force-refresh the view
        context.subscriptions.push(
            vscode.commands.registerCommand('babycoding.refreshView', () => {
                vscode.commands.executeCommand('workbench.view.extension.babycoding-sidebar');
            })
        );
        
        console.log('BabyCoding: Registered successfully');
        vscode.window.showInformationMessage('BabyCoding: View Registered!');

    } catch (error) {
        console.error('BabyCoding Activation Error:', error);
        vscode.window.showErrorMessage(`BabyCoding Error: ${error}`);
    }
}

export function deactivate() {}
