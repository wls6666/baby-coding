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
    console.log('BabyCoding: activate() called - v0.0.3 PANEL MODE');
    vscode.window.showInformationMessage('BabyCoding: v0.0.3 Loaded');

    // STRATEGY 1: The Sidebar (Try one last time with a fresh ID)
    try {
        const SIDEBAR_ID = 'babycoding-view-sidebar'; // NEW ID
        console.log(`BabyCoding: Registering Sidebar ${SIDEBAR_ID}`);
        const provider = new SimpleProvider();
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(SIDEBAR_ID, provider)
        );
    } catch (e) {
        console.error('Sidebar registration failed:', e);
    }

    // STRATEGY 2: The Panel (The "Nuclear Option")
    // If the sidebar fails, this command forces a panel to open.
    // This uses a completely different API (createWebviewPanel) which usually works when Sidebars fail.
    context.subscriptions.push(
        vscode.commands.registerCommand('babycoding.start', () => {
            vscode.window.showInformationMessage('Opening BabyCoding Panel...');
            
            const panel = vscode.window.createWebviewPanel(
                'babycoding-panel', // Internal ID
                'BabyCoding Board', // Title
                vscode.ViewColumn.One, // Column
                { enableScripts: true, retainContextWhenHidden: true }
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <body style="padding:20px; font-family: sans-serif;">
                    <h1>🚀 BabyCoding Panel</h1>
                    <p>If you see this, the Webview is working!</p>
                    <p>This is a standalone panel, bypassing the sidebar issues.</p>
                </body>
                </html>
            `;
        })
    );
}

export function deactivate() {}
