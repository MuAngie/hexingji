# “禾来过”共享计数

项目卡片中的“禾来过”按项目编号累计所有访客的点击次数，每次点击提交一次加 1；它不是去重人数。浏览器不保存或伪造累计总数。

## 运行方式

前端仍导出为静态页面；Cloudflare Worker 处理 `/api/visits/HJ-xxx`，其他请求使用原有静态资源。

每个项目使用独立的 `ProjectVisitCounter` Durable Object，以项目编号定位。计数写入其持久存储，读写在同一个对象内处理，避免多个访客并发时互相覆盖。不要改用浏览器计数或普通 KV 的“先读再写”累加。

| 请求 | 结果 |
| --- | --- |
| `GET /api/visits/HJ-001` | 读取总数，例如 `{"count": 12}`；新项目返回 0 |
| `POST /api/visits/HJ-001` | 加 1 并返回新的总数 |

只接受当前维护数据中存在的项目编号。不支持的方法返回 405，未知项目返回 404；响应禁止缓存。服务不可用时返回 503，前端显示简短失败提示，不假装成功。多次快速点击分别提交，响应乱序时不让已显示的总数倒退。

打开卡片和点击成功后读取总数；当前没有持续轮询或即时推送其他访客的点击。

## 本地预览

先构建静态资源，再通过 Wrangler 运行前端和计数接口：

```powershell
node node_modules/next/dist/bin/next build --webpack
npx wrangler@4.160.1 dev --port 3001
```

访问 `http://127.0.0.1:3001/`。Wrangler 本地计数保存在 `.wrangler/`，不提交到 Git，也不代表线上数据。只运行 `next dev` 不包含 Cloudflare 计数接口，完整交互请使用 Wrangler 预览。

## 发布

现有站点：<https://hexingji.linjie-angie-gao.workers.dev/>。

`wrangler.jsonc` 已声明 `PROJECT_VISITS` 绑定及 `visits-v1` SQLite Durable Object 迁移。现有 Cloudflare Git 构建流程应在构建静态页面后按此配置部署；首次部署将创建计数命名空间，不需要额外手填数据库编号。也可在已登录的 Cloudflare 账号中运行：

```powershell
npx wrangler@4.160.1 deploy
```

代码提交／推送不等于发布成功，须检查 Cloudflare 部署结果和线上接口。后续更新须保留绑定名、类名、迁移记录和项目编号，避免意外切换到另一份计数。不要在线上接口执行会加次数的自动化测试；并发和点击验证应使用本地环境。

参考：[Cloudflare 计数示例](https://developers.cloudflare.com/durable-objects/examples/build-a-counter/)、[SQLite 持久存储](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)、[静态资源与 API 路由](https://developers.cloudflare.com/workers/static-assets/binding/)。
