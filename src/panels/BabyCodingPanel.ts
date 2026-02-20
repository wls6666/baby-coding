import * as vscode from "vscode";

export class BabyCodingPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "babycoding-view";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {
      console.log('BabyCodingPanel: Constructor called (Minimal Mode)');
  }

  public async ask(question: string) {
      if (this._view) {
          this._view.webview.postMessage({ type: 'chatResponse', message: `Echo: ${question}` });
      }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('BabyCodingPanel.resolveWebviewView called (Minimal Mode)');
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BabyCoding</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #007acc; }
        </style>
    </head>
    <body>
        <h1>Hello BabyCoding!</h1>
        <p>If you see this, the extension is working correctly.</p>
        <p>Testing view registration...</p>
        <p>Timestamp: ${new Date().toLocaleTimeString()}</p>
    </body>
    </html>`;
    
    console.log('BabyCodingPanel: HTML set');
  }
}
