# 👶 BabyCoding: The Beginner Dev OS

> **让编程像聊天一样简单 —— 面向绝对新手的 AI 原生开发环境**  
> *Make coding as easy as chatting - An AI-Native Dev Environment for absolute beginners.*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.2.97-green.svg)
![Status](https://img.shields.io/badge/status-Alpha-orange.svg)

**BabyCoding** 是一个运行在 VS Code 中的插件，但它不仅仅是一个插件。它是为**零基础编程新手**设计的“操作系统”。它的目标是消除所有技术障碍（环境配置、命令行、Git、报错调试），让你只关注**想法**本身。

从一个点子，到上线的真实项目，BabyCoding 全程陪伴，手把手教你“做中学”。

---

## ✨ 核心特性 (Features)

### 1. 🤖 智能体协作架构 (Agentic Workflow)
BabyCoding 背后有三个 AI 专家为你服务：
- **Planner (架构师)**: 听懂你的想法，将其拆解为一步步可执行的开发计划。
- **Builder (工程师)**: 自动执行终端命令、文件操作和代码编写。
- **Tutor (导师)**: 实时解释每一步发生了什么，教你编程知识，而不是只给你代码。

### 2. 🛠️ 零门槛环境 (Zero-Config Environment)
- 自动检测系统环境 (Windows/macOS/Linux)。
- 自动生成并执行安装命令 (Git, Node.js, Python 等)。
- 再也不用担心 "Command not found" 或环境变量配置错误。

### 3. 📝 交互式开发流 (Interactive Flow)
- **自然语言交互**: 你说“我想做一个贪吃蛇游戏”，它就开始工作。
- **可视化计划**: 在侧边栏直观看到项目进度，点击“执行”即可运行每一步。
- **上下文感知**: 选中代码右键点击 "Ask BabyCoding"，直接询问 AI 这段代码的含义。
- **实时反馈**: 运行成功了？报错了？Tutor 都会用大白话解释给你听。

### 4. 📚 知识沉淀 (Knowledge Base)
- 自动记录项目中的术语解释和技术点。
- (开发中) 支持一键同步到 Notion，形成你的个人技术知识库。

---

## 🚀 快速开始 (Quick Start)

### 前置要求
- [Visual Studio Code](https://code.visualstudio.com/) (v1.85.0+)
- [Node.js](https://nodejs.org/) (v18+) & [Git](https://git-scm.com/) (推荐安装，插件也可辅助安装)

### 安装方法

由于本项目目前处于预览阶段（Preview），尚未发布到 VS Code 插件市场，请选择以下方式之一安装：

#### 方式 A：从 Release 下载安装 (推荐)
1. 前往本仓库的 [Releases 页面](../../releases) 下载最新的 `.vsix` 文件。
2. 在 VS Code 中打开扩展面板 (`Ctrl+Shift+X`)。
3. 点击右上角 `...` -> `Install from VSIX...`，选择下载的文件即可。

#### 方式 B：源码运行 (开发调试)
```bash
# 1. 克隆仓库
git clone https://github.com/your-username/baby-coding.git

# 2. 安装依赖
cd baby-coding
npm install

# 3. 运行调试
# 在 VS Code 中打开项目，按 F5 启动调试窗口
```

详细安装教程请参考：👉 [安装指南 (docs/INSTALL.md)](docs/INSTALL.md)

---

## 📖 使用指南 (Usage)

1. **配置 AI 模型**:
   - 安装后，按 `Ctrl+,` 打开设置，搜索 `babycoding`。
   - 选择 `Provider` (OpenAI / Gemini)。
   - 填入你的 `API Key`。

2. **启动项目**:
   - 按 `Ctrl+Shift+P` 打开命令面板。
   - 输入 `BabyCoding: Start Project`。

3. **开始创造**:
   - 在侧边栏对话框中输入你的想法（例如：“帮我写一个网页版的番茄钟”）。
   - 确认生成的计划，点击 `Run` 执行每一步。
   - 观察终端输出和 Tutor 的解释，享受编程的乐趣！

---

## 🗺️ 路线图 (Roadmap)

- [x] **v0.1 (Alpha)**: 基础架构、聊天界面、计划生成、命令执行、环境检查。
- [x] **v0.2**: 增强错误处理与自动重试机制 (Self-Healing)，修复 UI 交互问题。
- [ ] **v0.3**: 集成 Notion API，实现知识库同步。
- [ ] **v0.4**: 深度集成 GitHub (自动 Commit/Push)。
- [ ] **v1.0**: 正式发布到 VS Code Marketplace。

---

## 🤝 贡献 (Contributing)

我们非常欢迎任何形式的贡献！无论是提交 Bug、建议新功能，还是提交代码。

1. Fork 本仓库。
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)。
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)。
4. 推送到分支 (`git push origin feature/AmazingFeature`)。
5. 开启一个 Pull Request。

---

## 📄 许可证 (License)

本项目基于 [MIT 许可证](LICENSE) 开源。

---

Made with ❤️ by the BabyCoding Team
