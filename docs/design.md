# BabyCoding v0.1 设计文档

## 1. 系统架构

BabyCoding 插件采用以 VS Code 扩展宿主为中心的模块化架构。它利用 VS Code API 进行 UI 集成，并利用外部 CLI 工具进行执行。

### 高层组件

1.  **扩展核心 (主进程)**:
    *   **Controller (控制器)**: 编排整个生命周期。
    *   **State Management (状态管理)**: 管理全局/工作区状态（API 密钥、用户偏好）。
    *   **Event Bus (事件总线)**: 处理组件之间的通信。

2.  **Agent 层 (大脑)**:
    *   **Planner Agent (规划者)**: 将用户意图分解为可执行的步骤。
    *   **Builder Agent (构建者 - OpenCode 封装)**: 将步骤转化为 CLI 命令或代码编辑。
    *   **Tutor Agent (导师)**: 监控执行情况，解释错误，并提取知识点。

3.  **基础设施层 (工具)**:
    *   **EnvManager (环境管理器)**: 处理系统依赖检查和安装 (Git, Node, Python)。
    *   **LLMService (LLM 服务)**: OpenAI/Gemini API 的抽象接口。
    *   **KnowledgeBase (知识库)**: 管理本地 Markdown 文件或 Notion 同步。

4.  **UI 层 (Webview)**:
    *   **Chat Interface (聊天界面)**: 自然语言交互。
    *   **Plan Dashboard (计划仪表板)**: 项目路线图的可视化展示。
    *   **Setup Wizard (设置向导)**: 一步一步的新手引导。

## 2. 核心模块详细设计

### 2.1 设置向导 (新手引导)
*   **目标**: 确保用户在不离开 VS Code 的情况下拥有可工作的开发环境。
*   **流程**:
    1.  **欢迎屏幕**: 解释 "BabyCoding" 是什么。
    2.  **API 密钥输入**: 验证与 OpenAI/Gemini 的连接。
    3.  **环境检查**: 运行 `git --version`, `node -v`, `python --version`。
    4.  **自动安装**:
        *   **Windows**: 执行 `winget install -e --id <ID>`。
        *   **macOS**: 执行 `brew install <package>`。
        *   **Linux**: 执行 `sudo apt-get install <package>`。
    5.  **验证**: 重新运行版本检查。

### 2.2 项目规划器 (大脑)
*   **输入**: 用户的自然语言想法 (例如，“我想做一个个人网站”)。
*   **流程**:
    1.  选择一个模板 (例如，“静态网站”，“Python 脚本”)。
    2.  将想法和模板上下文发送给 LLM。
    3.  接收结构化的 JSON 计划。
*   **输出**: `ProjectPlan` 对象。

### 2.3 执行循环 (构建者)
*   **流程**:
    `while (currentStep.status !== 'completed')`:
        1.  **上下文**: 收集文件内容 + 上一步的输出。
        2.  **动作**: Builder Agent 生成具体的命令/代码。
        3.  **执行**: 通过 `OpenCode CLI` 或 VS Code 终端运行。
        4.  **验证**: 运行验证命令 (例如 `npm test`, `curl localhost`)。
        5.  **结果**:
            *   *成功*: 标记步骤完成，触发 Tutor 解释。
            *   *失败*: 触发 Tutor 错误分析 -> 修复 -> 重试。

### 2.4 知识系统 (记忆)
*   **触发**: 在每一步或用户查询之后。
*   **动作**:
    1.  提取关键术语 (例如 "HTML", "Variable")。
    2.  检查术语是否存在于数据库中。
    3.  如果是新的，生成简单的解释。
    4.  保存到 `.babycoding/knowledge.md` 或 Notion API。

## 3. 数据结构

### 3.1 项目计划模式 (Project Plan Schema)
```typescript
interface ProjectPlan {
    id: string;
    title: string;
    goal: string;
    steps: Step[];
    status: 'planning' | 'active' | 'completed';
}

interface Step {
    id: string;
    title: string;
    description: string;
    command: string; // 要执行的命令
    verification: string; // 验证成功的命令
    terms: Term[]; // 涉及的教育术语
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
    error?: string;
}

interface Term {
    name: string;
    definition: string;
}
```

### 3.2 知识条目 (Knowledge Entry)
```typescript
interface KnowledgeEntry {
    term: string;
    category: 'concept' | 'error' | 'tool';
    explanation: string; // "就像一个存储数据的盒子..."
    relatedStepId?: string;
    timestamp: number;
}
```

## 4. 关键工作流

### 4.1 "开始第一个项目"
1.  用户点击 "Start" (开始)。
2.  系统: "你想做什么？"
3.  用户: "一个计时器应用。"
4.  Planner Agent: 生成 5 个步骤 (初始化, HTML, CSS, JS, 运行)。
5.  UI: 显示步骤。
6.  用户: 点击 "Execute Step 1" (执行步骤 1)。
7.  Builder Agent: 运行 `npm init -y` 并创建 `index.html`。
8.  Tutor Agent: "我们刚刚创建了应用的骨架。`index.html` 就像房子的框架。"

### 4.2 错误处理 ("无恐慌"模式)
1.  Builder Agent 运行代码 -> 报错: `ReferenceError: x is not defined`。
2.  系统捕获 stderr。
3.  Tutor Agent 分析: "理想情况下，电脑在使用 'x' 之前需要知道它是什么。看来你忘了声明它。"
4.  Builder Agent 提出修复: `let x = 0;`。
5.  用户批准修复。
6.  系统应用修复并重新运行。

## 5. 技术栈

*   **宿主**: VS Code Extension API (Typescript)。
*   **UI**: React + Vite (打包进 Webview)。
*   **LLM 客户端**: `openai` npm 包 (兼容其他提供商)。
*   **终端**: VS Code `Terminal` API 用于可见性 + `child_process` 用于后台检查。
*   **状态**: `vscode.Memento` 用于持久化。

## 6. 实施路线图

1.  **阶段 1: 基础**: 扩展脚手架，Webview 设置，LLM 服务连接。
2.  **阶段 2: 新手引导**: 环境检测和自动安装脚本。
3.  **阶段 3: 核心 Agent**: Planner 和 Builder 的实现以及提示工程。
4.  **阶段 4: UI/UX**: 交互式聊天和计划可视化。
5.  **阶段 5: 知识**: 本地 Markdown 同步和 Notion 集成。
