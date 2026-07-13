# 夜市怪谈摊主

面向“游戏运营 / AI Agent 工程师”岗位的 AI LiveOps 作品集项目。

当前已经完成 Web MVP、NPC Agent 雏形、运营数据后台、AI 运营 Agent、配置热更新工作台和 Tauri 桌面应用骨架：

1. 三天夜市经营循环。
2. 进货、接待 NPC、销售和收摊结算。
3. 基础事件埋点。
4. 运营数据看板。
5. 本地模拟 AI 运营日报和活动配置草案。
6. 配置驱动视图，后续接入 schema 校验和回滚。
7. NPC 角色偏好、预算、厌恶项、动态情绪和结构化记忆。
8. NPC Agent 工具轨迹：读取库存、价格、NPC 记忆和任务状态。
9. Agent 页展示最近一次 NPC 决策、规则边界和 NPC 记忆账本。
10. 运营后台展示任务完成率、商品购买转化、NPC 互动率、流失节点和基础 A/B 测试。
11. AI 运营 Agent 基于运营指标生成日报、异常原因假设、行动计划、调参建议和活动配置草案。
12. 配置工作台支持 schema 校验、人工确认、应用草案、配置历史和回滚。
13. 应用配置后可以实际影响局内经济，例如首购补贴和偏好商品补货成本。
14. Tauri 桌面端整合现有游戏、运营后台、AI 工作台和配置工作台。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 桌面端

```bash
npm run desktop:dev
npm run desktop:build
```

Windows 安装包生成位置：

```text
src-tauri/target/release/bundle/nsis/AI LiveOps Night Market_0.6.0_x64-setup.exe
```

## 当前版本

```text
v0.6.0-tauri-desktop
```

## 版本管理

远程仓库固定为：

```text
https://github.com/Ey1afjalla/second-game.git
```

每一版完成后必须提交并推送到 GitHub。
