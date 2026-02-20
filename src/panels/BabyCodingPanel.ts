import * as vscode from "vscode";
import { LLMFactory, LLMService, LLMMessage } from "../services/llm";
import { EnvManager } from "../services/envManager";
import { PlannerAgent, ProjectPlan } from "../agents/planner";
import { BuilderAgent } from "../agents/builder";
import { TutorAgent } from "../agents/tutor";

export class BabyCodingPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "babycoding-view";
  private _view?: vscode.WebviewView;
  private _llmService?: LLMService;
  private _plannerAgent?: PlannerAgent;
  private _builderAgent?: BuilderAgent;
  private _tutorAgent?: TutorAgent;
  private _isPlanningMode = false;
  private _currentPlan?: ProjectPlan;

  private _chatHistory: LLMMessage[] = [
    { role: 'system', content: 'You are BabyCoding, a helpful coding assistant for absolute beginners. Explain things simply. Use Chinese for explanations unless asked otherwise.' }
  ];

  constructor(private readonly _extensionUri: vscode.Uri) {
      this._builderAgent = new BuilderAgent();
  }

  public async ask(question: string) {
    if (this._view) {
        this._view.webview.postMessage({ type: 'userQuestion', message: question });
        await this._handleChatMessage(question);
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "startProject": {
            this._isPlanningMode = true;
            this._view?.webview.postMessage({ type: 'chatResponse', message: "What do you want to build? (Tell me your idea, e.g., 'A snake game' or 'A personal website')\n\n你想做什么项目？（告诉我你的想法，比如“贪吃蛇游戏”或“个人网站”）" });
            break;
        }
        case "setup": {
            await this._handleSetup();
            break;
        }
        case "chat": {
            if (this._isPlanningMode) {
                await this._handlePlanning(data.message);
            } else {
                await this._handleChatMessage(data.message);
            }
            break;
        }
        case "executeStep": {
            await this._executeStep(data.stepId);
            break;
        }
      }
    });
  }

  private async _executeStep(stepId: string) {
      if (!this._currentPlan || !this._builderAgent) return;
      if (!(await this._ensureLLM())) return; // Tutor needs LLM
      
      const step = this._currentPlan.steps.find(s => s.id === stepId);
      if (!step) return;

      this._view?.webview.postMessage({ type: 'chatResponse', message: `🚀 Executing Step: ${step.title}...\nExecuting: \`${step.command}\`` });

      try {
          await this._builderAgent.executeStep(step);
          
          // In v0.1, we assume success after sending command.
          // Trigger Tutor to explain what happened.
          if (this._tutorAgent) {
              const explanation = await this._tutorAgent.explainSuccess(step);
              this._view?.webview.postMessage({ type: 'chatResponse', message: `👨‍🏫 **Tutor**: ${explanation}` });
          }
      } catch (error: any) {
          if (this._tutorAgent) {
              const explanation = await this._tutorAgent.explainError(step, error.message || "Unknown error");
              this._view?.webview.postMessage({ type: 'chatResponse', message: `❌ **Error**: ${explanation}` });
          }
      }
  }

  private async _ensureLLM() {
    if (this._llmService) return true;

    const config = vscode.workspace.getConfiguration('babycoding');
    const apiKey = config.get<string>('llm.apiKey');
    const provider = config.get<string>('llm.provider') || 'openai';

    if (!apiKey) {
        this._view?.webview.postMessage({ 
            type: 'chatResponse', 
            message: "⚠️ Please set your API Key in Settings first. Run 'Setup Wizard'." 
        });
        return false;
    }

    try {
        this._llmService = LLMFactory.create(provider as any, apiKey);
        this._plannerAgent = new PlannerAgent(this._llmService);
        this._tutorAgent = new TutorAgent(this._llmService);
        return true;
    } catch (e: any) {
        this._view?.webview.postMessage({ type: 'chatResponse', message: `Error: ${e.message}` });
        return false;
    }
  }

  private async _handlePlanning(userIdea: string) {
      if (!this._view) return;
      if (!(await this._ensureLLM())) return;

      this._view.webview.postMessage({ type: 'chatResponse', message: "Thinking about your project plan... (正在生成项目计划...)" });

      try {
          if (!this._plannerAgent) return;
          const plan = await this._plannerAgent.createPlan(userIdea);
          this._currentPlan = plan; // Store current plan
          
          this._isPlanningMode = false; // Exit planning mode
          
          // Send Plan UI
          this._view.webview.postMessage({ 
              type: 'plan', 
              plan: plan 
          });

      } catch (error: any) {
          this._view.webview.postMessage({ type: 'chatResponse', message: `Error generating plan: ${error.message}` });
      }
  }

  private async _handleSetup() {
      if (!this._view) { return; }
      
      this._view.webview.postMessage({ type: 'chatResponse', message: "🔍 Checking your environment... (正在检查环境...)" });

      const status = await EnvManager.checkEnvironment();
      const missing: string[] = [];
      let report = "Environment Status (环境状态):\n";
      
      report += `Git: ${status.git ? '✅ ' + status.gitVersion : '❌ Not Found'}\n`;
      if (!status.git) missing.push('git');

      report += `Node.js: ${status.node ? '✅ ' + status.nodeVersion : '❌ Not Found'}\n`;
      if (!status.node) missing.push('node');

      report += `Python: ${status.python ? '✅ ' + status.pythonVersion : '❌ Not Found'}\n`;
      if (!status.python) missing.push('python');

      this._view.webview.postMessage({ type: 'chatResponse', message: report });

      if (missing.length > 0) {
          this._view.webview.postMessage({ type: 'chatResponse', message: "⚠️ Some tools are missing. I can generate install commands for you. (部分工具缺失，我可以为你生成安装命令。)" });
          const commands = EnvManager.getInstallCommands(missing);
          if (commands.length > 0) {
              this._view.webview.postMessage({ 
                  type: 'chatResponse', 
                  message: "Run these commands in your terminal (请在终端运行以下命令):\n\n" + commands.map(c => `\`${c}\``).join('\n') 
              });
          }
      } else {
          this._view.webview.postMessage({ type: 'chatResponse', message: "🎉 All set! You are ready to start coding. (一切就绪！你可以开始编程了。)" });
      }
  }

  private async _handleChatMessage(userMessage: string) {
      if (!this._view) { return; }
      if (!(await this._ensureLLM())) return;

      // Update History
      this._chatHistory.push({ role: 'user', content: userMessage });

      // Call LLM
      try {
          if (!this._llmService) return;
          const response = await this._llmService.generate(this._chatHistory);
          
          // Update History with response
          this._chatHistory.push({ role: 'assistant', content: response.content });

          // Send response back to Webview
          this._view.webview.postMessage({ type: 'chatResponse', message: response.content });

      } catch (error: any) {
          this._view.webview.postMessage({ type: 'chatResponse', message: `Error: ${error.message}` });
      }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    const nonce = getNonce();
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BabyCoding</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                padding: 10px; 
                display: flex; 
                flex-direction: column; 
                height: 100vh; 
                box-sizing: border-box;
            }
            .header { margin-bottom: 10px; text-align: center; }
            .header h1 { margin: 0; font-size: 1.2em; }
            
            #chat-container {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 10px;
                border: 1px solid var(--vscode-widget-border);
                padding: 10px;
                border-radius: 5px;
                background-color: var(--vscode-editor-background);
            }
            
            .message { margin-bottom: 8px; padding: 8px; border-radius: 5px; word-wrap: break-word; white-space: pre-wrap; }
            .user-message { 
                background-color: var(--vscode-button-background); 
                color: var(--vscode-button-foreground); 
                align-self: flex-end; 
                margin-left: 20px;
            }
            .ai-message { 
                background-color: var(--vscode-editor-inactiveSelectionBackground); 
                color: var(--vscode-editor-foreground); 
                align-self: flex-start; 
                margin-right: 20px;
            }
            
            /* Plan Styles */
            .plan-container {
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 10px;
            }
            .plan-title { font-weight: bold; font-size: 1.1em; margin-bottom: 5px; }
            .plan-goal { font-style: italic; margin-bottom: 10px; opacity: 0.8; }
            .step-item {
                background-color: var(--vscode-editor-background);
                padding: 8px;
                margin-bottom: 5px;
                border-radius: 3px;
                border: 1px solid var(--vscode-widget-border);
            }
            .step-header { display: flex; justify-content: space-between; align-items: center; }
            .step-title { font-weight: bold; }
            .step-desc { font-size: 0.9em; margin-top: 5px; opacity: 0.9; }
            .run-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 0.8em;
                border-radius: 2px;
            }
            .run-btn:hover { background-color: var(--vscode-button-hoverBackground); }

            .input-area { display: flex; gap: 5px; }
            input[type="text"] {
                flex: 1;
                padding: 8px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 3px;
            }
            button { 
                background-color: var(--vscode-button-background); 
                color: var(--vscode-button-foreground); 
                border: none; 
                padding: 8px 12px; 
                cursor: pointer; 
                border-radius: 3px;
            }
            button:hover { background-color: var(--vscode-button-hoverBackground); }
            
            .actions { display: flex; gap: 5px; margin-bottom: 10px; justify-content: center; }
            .actions button { font-size: 0.8em; padding: 5px 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>BabyCoding</h1>
        </div>

        <div class="actions">
            <button id="btn-setup">⚙️ Setup</button>
            <button id="btn-newproject">🚀 New Project</button>
        </div>

        <div id="chat-container">
            <div class="message ai-message">Hi! I'm BabyCoding. What do you want to build today? (你好！我是 BabyCoding。今天想做点什么？)</div>
        </div>

        <div class="input-area">
            <input type="text" id="messageInput" placeholder="Type your idea... (输入你的想法...)" />
            <button id="btn-send">Send</button>
        </div>
        
        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const chatContainer = document.getElementById('chat-container');
            const messageInput = document.getElementById('messageInput');
            const btnSend = document.getElementById('btn-send');
            const btnSetup = document.getElementById('btn-setup');
            const btnNewProject = document.getElementById('btn-newproject');

            // Event Listeners
            btnSend.addEventListener('click', sendUserMessage);
            btnSetup.addEventListener('click', () => sendSystemMessage('setup'));
            btnNewProject.addEventListener('click', () => sendSystemMessage('startProject'));
            
            messageInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    sendUserMessage();
                }
            });

            function sendSystemMessage(type) {
                vscode.postMessage({ type: type });
            }

            function sendUserMessage() {
                const text = messageInput.value;
                if (!text) return;

                addMessage(text, 'user-message');
                messageInput.value = '';

                vscode.postMessage({ type: 'chat', message: text });
            }
            
            // Expose executeStep to global scope for dynamic HTML buttons
            window.executeStep = function(stepId) {
                vscode.postMessage({ type: 'executeStep', stepId: stepId });
            }

            function addMessage(text, className) {
                const div = document.createElement('div');
                div.className = 'message ' + className;
                div.textContent = text;
                chatContainer.appendChild(div);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            function renderPlan(plan) {
                const div = document.createElement('div');
                div.className = 'plan-container';
                
                let html = '<div class="plan-title">' + plan.title + '</div>';
                html += '<div class="plan-goal">' + plan.goal + '</div>';
                
                plan.steps.forEach(step => {
                    html += '<div class="step-item">';
                    html += '<div class="step-header">';
                    html += '<span class="step-title">' + step.title + '</span>';
                    // Use window.executeStep
                    html += '<button class="run-btn" onclick="window.executeStep(\\'' + step.id + '\\')">▶ Run</button>';
                    html += '</div>';
                    html += '<div class="step-desc">' + step.description + '</div>';
                    html += '</div>';
                });

                div.innerHTML = html;
                chatContainer.appendChild(div);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'chatResponse':
                        addMessage(message.message, 'ai-message');
                        break;
                    case 'userQuestion':
                        addMessage(message.message, 'user-message');
                        break;
                    case 'plan':
                        renderPlan(message.plan);
                        break;
                }
            });
        </script>
    </body>
    </html>`;
  }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
