# BabyCoding 安装指南 (Installation Guide)

本文档提供 BabyCoding 插件的详细安装步骤，适用于不同需求的用户。

---

## 目录
1. [我是普通用户：直接安装插件](#1-我是普通用户直接安装插件)
2. [我是开发者：源码运行与调试](#2-我是开发者源码运行与调试)
3. [高级：自行打包 VSIX](#3-高级自行打包-vsix)

---

## 1. 我是普通用户：直接安装插件

如果你只想体验 BabyCoding 的功能，不需要查看代码，请使用此方法。

### 步骤
1. **下载插件包**：
   - 访问 GitHub 仓库的 [Releases 页面](../../releases)。
   - 下载最新版本的 `.vsix` 文件（例如 `baby-coding-0.1.0.vsix`）。

2. **安装到 VS Code**：
   - 打开 VS Code。
   - 点击左侧边栏的 **扩展 (Extensions)** 图标 (快捷键 `Ctrl+Shift+X`)。
   - 点击扩展面板右上角的 **"..." (更多操作)** 菜单。
   - 选择 **"从 VSIX 安装..." (Install from VSIX...)**。
   - 在弹出的文件选择框中，选中刚才下载的 `.vsix` 文件。

3. **完成**：
   - 右下角提示安装完成后，建议重启 VS Code。
   - 参考 [README.md](../README.md) 中的“使用指南”开始配置 API Key。

---

## 2. 我是开发者：源码运行与调试

如果你想参与 BabyCoding 的开发，或者想修改源码，请使用此方法。

### 前置要求
- [Node.js](https://nodejs.org/) (v18 或更高版本)
- [Git](https://git-scm.com/)

### 步骤

1. **获取代码**：
   打开终端 (Terminal/PowerShell)，执行：
   ```bash
   git clone https://github.com/your-username/baby-coding.git
   cd baby-coding
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```
   > 如果安装速度慢，可以使用淘宝镜像：`npm install --registry=https://registry.npmmirror.com`

3. **启动调试**：
   - 在 VS Code 中打开项目文件夹 (`code .`)。
   - 按下 `F5` 键（或点击左侧 "运行和调试" 图标 -> "Run Extension"）。
   - 这将打开一个新的 VS Code 窗口（扩展开发宿主），该窗口中已加载了你正在开发的插件。

4. **热更新**：
   - 修改代码后，只需在调试工具栏点击 "重启 (Restart)" 图标 (绿色圆圈箭头)，即可在宿主窗口中应用更改。

---

## 3. 高级：自行打包 VSIX

如果你修改了代码，想生成一个新的 `.vsix` 文件发给朋友使用：

1. **安装打包工具**：
   ```bash
   npm install -g @vscode/vsce
   ```

2. **执行打包**：
   在项目根目录下运行：
   ```bash
   vsce package
   ```
   *注意：如果遇到 `npm run compile` 错误，请确保先运行过 `npm install`。*

3. **获取文件**：
   执行成功后，项目根目录下会生成一个新的 `.vsix` 文件。

---

如有任何安装问题，请提交 [Issue](../../issues)。
