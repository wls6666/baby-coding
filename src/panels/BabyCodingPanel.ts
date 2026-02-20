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
  private _viewReady = false;
  private _pendingMessages: any[] = [];

  private _chatHistory: LLMMessage[] = [
    { role: 'system', content: 'You are BabyCoding, a helpful coding assistant for absolute beginners. Explain things simply. Use Chinese for explanations unless asked otherwise.' }
  ];

  constructor(private readonly _extensionUri: vscode.Uri) {
      this._builderAgent = new BuilderAgent();
  }

  public async ask(question: string) {
    const msg = { type: 'userQuestion', message: question };
    
    if (this._view && this._viewReady) {
        this._view.webview.postMessage(msg);
        await this._handleChatMessage(question);
    } else {
        // Queue the message and ensure view is focused/created
        this._pendingMessages.push({ ...msg, isAsk: true });
        vscode.commands.executeCommand('babycoding-view.focus');
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log('BabyCodingPanel.resolveWebviewView called');
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'webviewReady': {
            console.log('Webview is ready');
            this._viewReady = true;
            while (this._pendingMessages.length > 0) {
                const msg = this._pendingMessages.shift();
                if (msg.isAsk) {
                    this._view?.webview.postMessage({ type: msg.type, message: msg.message });
                    await this._handleChatMessage(msg.message);
                } else {
                    this._view?.webview.postMessage(msg);
                }
            }
            break;
        }
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
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src 'self' data: https:; img-src 'self' data: https:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BabyCoding</title>
        <style>
            :root {
                --chat-bg: var(--vscode-editor-background);
                --user-msg-bg: var(--vscode-button-background);
                --user-msg-fg: var(--vscode-button-foreground);
                --ai-msg-bg: var(--vscode-editor-inactiveSelectionBackground);
                --ai-msg-fg: var(--vscode-editor-foreground);
                --border-color: var(--vscode-widget-border);
            }
            body { 
                font-family: var(--vscode-font-family); 
                padding: 16px; 
                display: flex; 
                flex-direction: column; 
                height: 100vh; 
                box-sizing: border-box;
                background-color: var(--chat-bg);
                color: var(--ai-msg-fg);
            }
            
            /* Welcome Guide */
            .welcome-guide {
                text-align: center;
                margin-bottom: 20px;
                padding: 15px;
                background-color: var(--ai-msg-bg);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
            .welcome-title { font-size: 1.4em; font-weight: bold; margin-bottom: 10px; }
            .welcome-desc { margin-bottom: 15px; opacity: 0.9; line-height: 1.4; }
            .feature-list { text-align: left; margin: 10px 0; padding-left: 20px; font-size: 0.9em; }
            
            /* Chat Area */
            #chat-container {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 15px;
                padding-right: 5px;
            }
            
            .message { 
                margin-bottom: 12px; 
                padding: 10px 14px; 
                border-radius: 8px; 
                word-wrap: break-word; 
                white-space: pre-wrap; 
                max-width: 85%;
                line-height: 1.5;
            }
            .user-message { 
                background-color: var(--user-msg-bg); 
                color: var(--user-msg-fg); 
                align-self: flex-end; 
                margin-left: auto;
                border-bottom-right-radius: 2px;
            }
            .ai-message { 
                background-color: var(--ai-msg-bg); 
                color: var(--ai-msg-fg); 
                align-self: flex-start; 
                margin-right: auto;
                border-bottom-left-radius: 2px;
            }
            
            /* Plan Styles */
            .plan-container {
                background-color: var(--ai-msg-bg);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                border: 1px solid var(--border-color);
            }
            .plan-title { font-weight: bold; font-size: 1.1em; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; }
            .plan-goal { font-style: italic; margin-bottom: 12px; opacity: 0.8; font-size: 0.95em; }
            .step-item {
                background-color: var(--chat-bg);
                padding: 10px;
                margin-bottom: 8px;
                border-radius: 6px;
                border: 1px solid var(--border-color);
            }
            .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
            .step-title { font-weight: 600; font-size: 0.95em; }
            .step-desc { font-size: 0.9em; opacity: 0.9; }
            .run-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 4px 10px;
                cursor: pointer;
                font-size: 0.85em;
                border-radius: 4px;
                transition: opacity 0.2s;
            }
            .run-btn:hover { opacity: 0.9; }

            /* Input Area */
            .input-area { 
                display: flex; 
                gap: 8px; 
                padding-top: 10px;
                border-top: 1px solid var(--border-color);
            }
            input[type="text"] {
                flex: 1;
                padding: 10px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                outline: none;
            }
            input[type="text"]:focus {
                border-color: var(--vscode-focusBorder);
            }
            button.send-btn { 
                background-color: var(--vscode-button-background); 
                color: var(--vscode-button-foreground); 
                border: none; 
                padding: 0 16px; 
                cursor: pointer; 
                border-radius: 4px;
                font-weight: 600;
            }
            button.send-btn:hover { background-color: var(--vscode-button-hoverBackground); }
            
            /* Quick Actions */
            .actions { 
                display: flex; 
                gap: 8px; 
                margin-bottom: 15px; 
                justify-content: center; 
                flex-wrap: wrap;
            }
            .action-btn { 
                background-color: var(--ai-msg-bg);
                color: var(--ai-msg-fg);
                border: 1px solid var(--border-color);
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.85em;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .action-btn:hover { background-color: var(--border-color); }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <div class="welcome-guide">
                <div class="welcome-title">👶 BabyCoding Guide</div>
                <div class="welcome-desc">
                    欢迎来到 BabyCoding！这里是你的零基础编程乐园。<br>
                    Welcome! Let's build something fun.
                </div>
                <ul class="feature-list">
                    <li>🚀 <b>New Project</b>: 告诉我你想做什么（如“贪吃蛇”）</li>
                    <li>⚙️ <b>Setup</b>: 检查并安装 Git/Node/Python</li>
                    <li>💡 <b>Ask</b>: 选中代码右键 "Ask BabyCoding"</li>
                </ul>
            </div>
            
            <div class="actions">
                <button id="btn-setup" class="action-btn">⚙️ Environment Setup</button>
                <button id="btn-newproject" class="action-btn">🚀 Start New Project</button>
            </div>

            <div class="message ai-message">你好！我是 BabyCoding。你可以直接在这里告诉我你的想法，或者点击上方的按钮开始。<br>What do you want to build today?</div>
        </div>

        <div class="input-area">
            <input type="text" id="messageInput" placeholder="在此输入你的想法... (Type your idea here...)" />
            <button id="btn-send" class="send-btn">Send</button>
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
                div.innerHTML = text.replace(/\\n/g, '<br>'); // Simple formatting
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

            // Signal ready
            vscode.postMessage({ type: 'webviewReady' });
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
