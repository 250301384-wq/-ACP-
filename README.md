# ACP 阿里云大数据工程师题库学习网站

React 18 + TypeScript + Vite + Ant Design 5 实现的 ACP 大数据工程师认证题库学习网站，支持分类刷题、练习/背题/闯关、错题本、收藏、模拟考试、学习统计、深浅色主题与学习数据导入导出。

## 本地运行

```bash
npm install
npm run parse
npm run dev
```

Vite 已配置 `base: '/-ACP-/'`，本地开发默认访问 `http://localhost:5173/-ACP-/`。

## 题库导入

题库源文件放在 `source/` 目录：

- 优先读取 `source/ACP大数据工程师.docx`
- 如果不存在，则读取 `source/ACP大数据工程师_备考拆分Word包.zip` 中的 02-06 专项 Word 文档

导入命令：

```bash
npm run parse
```

导入后生成：

- `public/questions.json`
- `public/import_errors.json`
- `public/question_meta.json`

## GitHub Pages 部署

仓库推送到 `main` 后，`.github/workflows/deploy.yml` 会执行 `npm ci`、`npm run build`，并通过 GitHub Pages Actions 发布 `dist`。

访问路径：

https://250301384-wq.github.io/-ACP-/

如果 GitHub Pages 未启用，需要到 GitHub 仓库 `Settings -> Pages -> Source` 选择 `GitHub Actions`。

GitHub Pages 白屏时，优先检查 `vite.config.ts` 的 `base` 是否为 `/-ACP-/`。

## 功能截图占位

- 首页 Dashboard：总题数、刷题进度、正确率、今日目标、知识点速记
- 答题页：练习模式、背题模式、闯关模式、快捷键、固定操作栏
- 错题本：错因标注、个人笔记、重做、标记已掌握、Markdown 导出
- 模拟考试：随机抽题、固定题量、限时交卷、考试报告
- 学习统计：正确率趋势、知识点掌握度、错因分布、刷题数量

## 数据存储

学习数据保存在浏览器 LocalStorage 中，包括：

- `answer_records`
- `wrong_questions`
- `favorites`
- `notes`
- `doubts`
- `progress`
- `settings`

设置页提供 JSON 导出/导入，建议定期备份。

## 验证结果

已在 Windows 本地环境完成验证：

- `npm install`：通过，0 个安全漏洞
- `npm run parse`：通过，5 个专项 Word 文件共导入 831 题
- `npm run typecheck`：通过
- `npm run lint`：通过，0 warning
- `npm run build`：通过，输出 `dist/`
- 浏览器烟测：`http://127.0.0.1:5173/-ACP-/` 首页与答题页可正常加载，无控制台错误

导入结果：

- 总题数：831
- 成功写入 `questions.json`：831
- 硬失败题目：0
- `import_errors.json`：178 条源内容不完整提示，主要为原题缺少官方解析或 AI 解析，题目仍保留在题库中供人工复核
