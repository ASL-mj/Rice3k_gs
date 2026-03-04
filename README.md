# Rice3k_gs - Rice AI Intelligent Agent Platform

一个基于 React 的智能 AI 助手平台，专注于水稻基因组学研究和数据分析。

## 项目简介

Rice3k_gs 是一个现代化的 Web 应用程序，提供 AI 对话、任务管理、数据分析报告等功能，旨在帮助研究人员更高效地进行水稻基因组学研究。

## 主要功能

### 1. AI 对话助手
- 智能对话界面，支持 Markdown 和代码高亮
- 历史对话管理和检索
- 文件上传支持（图片、文档）
- 消息操作（复制、编辑、刷新、导出）

### 2. 任务管理
- 任务创建、监控和管理
- 任务状态跟踪（Planning、Running、Completed、Failed）
- 任务搜索和筛选
- 任务统计面板

### 3. 分析报告
- 报告列表和详情查看
- 分析步骤时间线
- 报告内容展示
- 报告状态管理

### 4. 生物信息学工具
- Blast 序列比对
- 基因注释
- ID 转换器
- GO 富集分析
- KEGG 富集分析
- 基因组浏览器

### 5. 账号管理
- 用户资料管理
- 安全设置（密码修改、双因素认证）
- 偏好设置（主题、语言、AI 行为）
- 账号数据导出和删除

## 技术栈

- **前端框架**: React 18
- **路由**: React Router v6
- **UI 组件**: Ant Design
- **样式**: CSS Modules
- **Markdown 渲染**: react-markdown
- **代码高亮**: rehype-highlight
- **构建工具**: Vite

## 项目结构

```
Rice3k_gs/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 图片、图标等资源
│   │   ├── icons/         # SVG 图标
│   │   └── images/        # 图片资源
│   ├── components/        # 可复用组件
│   │   ├── CodeBlock.jsx  # 代码块组件
│   │   ├── Header.jsx     # 页面头部
│   │   ├── LoginModal.jsx # 登录模态框
│   │   └── Sidebar.jsx    # 侧边栏导航
│   ├── pages/             # 页面组件
│   │   ├── AccountSettings.jsx  # 账号设置
│   │   ├── ChatPage.jsx         # 对话页面
│   │   ├── HelpFeedback.jsx     # 帮助反馈
│   │   ├── ReportPage.jsx       # 报告页面
│   │   └── TaskManagement.jsx   # 任务管理
│   ├── styles/            # 样式文件
│   │   ├── global.css     # 全局样式
│   │   └── *.module.css   # 模块化样式
│   ├── utils/             # 工具函数
│   ├── App.jsx            # 应用主组件
│   └── main.jsx           # 应用入口
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 安装和运行

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发模式

```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

应用将在 `http://localhost:5173` 启动

### 生产构建

```bash
# 使用 npm
npm run build

# 或使用 yarn
yarn build
```

构建产物将生成在 `dist` 目录

### 预览生产构建

```bash
# 使用 npm
npm run preview

# 或使用 yarn
yarn preview
```

## 功能特性

### 用户认证
- 登录/登出功能
- 登录状态持久化（localStorage）
- 路由保护（未登录自动重定向）
- 登录检查（关键操作需要登录）

### 响应式设计
- 侧边栏可折叠
- 适配不同屏幕尺寸
- 移动端友好

### 对话功能
- 实时消息发送
- Markdown 格式支持
- 代码语法高亮
- 消息历史记录
- 文件上传（图片、文档）
- 消息导出（Word、PDF、Markdown）

### 任务管理
- 任务状态实时更新
- 任务搜索和过滤
- 任务详情查看
- 任务操作（查看、停止、重启、下载、删除）

### 主题和个性化
- 明亮/暗黑主题切换
- 字体大小调整
- 多语言支持
- AI 行为自定义

## 开发指南

### 代码规范

- 使用 ES6+ 语法
- 组件使用函数式组件和 Hooks
- 样式使用 CSS Modules
- 遵循 React 最佳实践

### 添加新页面

1. 在 `src/pages/` 创建新的页面组件
2. 在 `src/styles/` 创建对应的样式文件
3. 在 `src/App.jsx` 中添加路由配置
4. 在 `src/components/Sidebar.jsx` 中添加导航项

### 样式约定

- 使用 CSS Modules 避免样式冲突
- 命名采用 camelCase
- 颜色使用统一的设计系统
- 响应式断点统一管理

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证

## 联系方式

- 项目地址: [https://github.com/ASL-mj/Rice3k_gs](https://github.com/ASL-mj/Rice3k_gs)
- 问题反馈: [Issues](https://github.com/ASL-mj/Rice3k_gs/issues)

## 更新日志

### v1.0.0 (2024-03-04)
- ✨ 初始版本发布
- 🎨 完整的 UI 界面设计
- 💬 AI 对话功能
- 📋 任务管理系统
- 📊 分析报告展示
- ⚙️ 账号设置功能
- 🔐 用户认证系统
- 📱 响应式设计

---

Made with ❤️ by Rice3k_gs Team