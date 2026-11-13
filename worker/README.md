# “禾来过”共享计数

项目卡片中的“禾来过”按项目编号累计有效记录。同一浏览器的匿名标识在同一项目、同一北京时间日期内最多保留一条记录；它不是实名人数统计。保留原有历史累计数，新保护只约束后续操作。浏览器不保存或伪造累计总数。

## 运行方式

前端仍导出为静态页面；Cloudflare Worker 处理 `/api/visits/HJ-xxx`，其他请求使用原有静态资源。

每个项目使用独立的 `ProjectVisitCounter` Durable Object，以项目编号定位。计数写入其持久存储，读写在同一个对象内处理，避免多个访客并发时互相覆盖。不要改用浏览器计数或普通 KV 的“先读再写”累加。

| 请求 | 结果 |
| --- | --- |
| `GET /api/visits/HJ-001` | 读取总数、版本、北京时间日期、当前匿名访客的当日记录及可撤销状态；必要时签发 HttpOnly Cookie |
| `GET /api/visits/HJ-001?requestId=UUID` | 核对当前访客未完成操作的回执 |
| `POST /api/visits/HJ-001`，`{action:"record", requestId:UUID, day:"YYYY-MM-DD"}` | 新有效记录加 1；同日重复或同请求重试不重复累加 |
| `POST /api/visits/HJ-001`，`{action:"undo", requestId:新UUID, recordRequestId:原UUID}` | 服务端确认所属访客及 10 秒期限后减 1；重复撤销不重复扣减 |

只接受当前维护数据中存在的项目编号。写入要求同源 Origin、签名 Cookie 和有效的操作编号。服务端事务原子处理每日限额、去重和撤销；沿用原 `count` 存储键。操作回执至少保留 7 天，过期日期的新写入会拒绝，避免很久后重放旧操作。

前端提交时立即锁定，成功后冷却 2 秒；提供服务端限定的 10 秒撤销。网络中断、刷新或关闭卡片后重开会先核对回执，重试沿用原编号。显示值按服务端版本更新，撤销后允许总数正确减少。

按 IP 的每个 60 秒固定窗口统计写入请求：超过 20 次时，未启用 Turnstile 则对新记录直接返回 429 和 `Retry-After`；启用后则要求新记录经过服务端验证。超过 60 次时，所有写入都临时限流。撤销、重复请求也消耗频率额度；20 次门槛不会妨碍已确认的重复记录和本人撤销。原始 IP 不持久保存，频率键使用服务端密钥计算的摘要。

不支持的方法返回 405，未知项目返回 404；响应禁止缓存。缺少 Cookie 签名密钥，或 Turnstile 只配置一半、在正式域名误用测试密钥时，只读已有总数，写入返回 503，前端不给出虚假成功提示。

打开卡片和点击成功后读取总数；当前没有持续轮询或即时推送其他访客的点击。

## 本地预览

先按 [保护配置步骤](TURNSTILE_SETUP.md) 准备本地 `.dev.vars`；当前只需 Cookie 签名密钥，再构建静态资源并通过 Wrangler 运行：

```powershell
node node_modules/next/dist/bin/next build --webpack
npx wrangler@4.160.1 dev --port 3000
```

访问 `http://127.0.0.1:3000/`。Wrangler 本地计数保存在 `.wrangler/`，不提交到 Git，也不代表线上数据。只运行 `next dev` 不包含 Cloudflare 计数接口，完整交互请使用 Wrangler 预览。

验证命令：

```powershell
node --test worker/visit-logic.node-test.mjs
node node_modules/vitest/vitest.mjs run src
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/test-visit-api.mjs http://127.0.0.1:3000
```

最后一条会在本地制造点击、撤销、并发和限流请求，不能对线上执行。脚本只允许 localhost／127.0.0.1，且不跟随重定向。

## 发布

现有站点：<https://hexingji.linjie-angie-gao.workers.dev/>。

只有用户明确要求“推送 Git”时才推送；Cloudflare 使用已有 Git 自动发布流程。当前暂不启用 Turnstile，正式发布前只需按 [配置步骤](TURNSTILE_SETUP.md) 设置 `VISIT_COOKIE_SECRET`。将来启用 Turnstile 时，再创建真实站点并同时添加两项验证密钥。本地测试密钥不用于线上。

`wrangler.jsonc` 保留 `PROJECT_VISITS` 绑定、`ProjectVisitCounter` 类及 `visits-v1` SQLite Durable Object 迁移，不需要新建数据库。`keep_vars: true` 保留在 Cloudflare 控制台设置的普通变量；密钥用 Secret 保存。

代码提交／推送不等于发布成功，须检查 Cloudflare 部署结果和线上接口。后续更新须保留绑定名、类名、迁移记录和项目编号，避免意外切换到另一份计数。不要在线上接口执行会加次数的自动化测试；并发和点击验证应使用本地环境。

匿名 Cookie 和 IP 限流可以减少误触、普通重复提交和单 IP 高频刷量；清除 Cookie、更换网络或分布式攻击仍可能绕过匿名限额，不能宣称绝对刷量免疫或真实独立人数。若后续出现这类攻击，再根据流量证据增加 Cloudflare 边缘规则或账号验证。

参考：[Cloudflare 计数示例](https://developers.cloudflare.com/durable-objects/examples/build-a-counter/)、[SQLite 持久存储](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)、[静态资源与 API 路由](https://developers.cloudflare.com/workers/static-assets/binding/)。
