# “禾来过”防误触与防刷配置

当前暂不启用 Turnstile，使用每日限额、防连点、请求去重、撤销和服务端限流。Turnstile 两项密钥都留空即可；只配置其中一项会暂停新增记录，防止误以为验证已生效。正式发布仍由用户明确要求推送 Git 后触发已有 Cloudflare 自动构建。

## 本地运行

1. 将根目录 `.dev.vars.example` 复制为 `.dev.vars`。已有 `.dev.vars` 时保留现有内容，不直接覆盖。
2. 为 `VISIT_COOKIE_SECRET` 填入一个新生成的随机值，至少 32 个字符；Turnstile 两项保持注释。可在自己的终端运行：

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. 构建并启动：

   ```powershell
   node node_modules/next/dist/bin/next build --webpack
   npx wrangler@4.160.1 dev --port 3000
   ```

4. 打开 <http://127.0.0.1:3000/>，点击项目的“禾来过”。同一浏览器、同一项目当天不重复加数；记录后 10 秒内可以撤销。当前无需创建 Turnstile 站点即可运行。

`.dev.vars` 已被 Git 忽略，不能提交或截图公开。若要本地测试验证分支，可同时取消 `.dev.vars.example` 中两项官方测试密钥的注释；它们仅在本机 localhost／127.0.0.1 上被本项目接受。只运行 Next 开发服务器不包含计数 API。

## 当前上线所需配置

在 **Workers & Pages → hexingji → Settings → Variables and Secrets** 添加 `VISIT_COOKIE_SECRET`，类型为 **Secret／加密密钥**，值为生产专用的随机字符串，至少 32 个字符。可用上面的命令生成，勿复用本地值。这项密钥用于防止匿名访客标识被伪造，独立于 Turnstile。

`TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY` 暂时都不设置。Cookie 密钥平时更新代码时保持不变，更换它会让已有匿名 Cookie 失效，历史总数仍保留。

## 将来启用 Turnstile

以下步骤当前可以跳过。决定启用后创建正式验证站点：

1. 登录 Cloudflare，在 **Turnstile → Add widget／添加小组件** 创建站点，名称可填“禾迹”。
2. 选择 **Managed／托管** 验证模式。
3. Hostnames 添加 **`hexingji.linjie-angie-gao.workers.dev`**，不带 `https://`、端口或路径。将来使用自定义域名时，再添加对应域名。
4. 保存后取得 **Site Key** 和 **Secret Key**。Site Key 是公开值，Secret Key 只放服务端。

然后在 **Workers & Pages → hexingji → Settings → Variables and Secrets** 同时添加两项 Turnstile 配置：

| 名称 | 类型 | 值 |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | 普通文本变量 | 正式站点的 Site Key |
| `TURNSTILE_SECRET_KEY` | Secret／加密密钥 | 正式站点的 Secret Key |

保留已有 `VISIT_COOKIE_SECRET`。不要将 Secret 写入前端变量、仓库或聊天消息。

项目已设 `keep_vars: true`，用于保留控制台配置的普通变量。不要改名或删除原有 Durable Object 绑定、类名、迁移记录，否则可能切换到另一份计数。

## 发布后核对

配置准备好后，等用户明确要求再推送 Git；在 Cloudflare 构建记录中确认发布成功。缺少 Cookie 签名密钥或 Turnstile 配置不完整时，总数仍可读取，新增记录关闭；页面只显示简短不可用提示。

同一 IP 每个 60 秒固定窗口内超过 20 次写入请求后，当前模式会临时拒绝新增记录，返回等待秒数；已确认的重复记录和本人撤销仍可处理。超过 60 次后所有写入临时限流。以后启用 Turnstile 时，20 次门槛改为要求验证，结果由服务端检查。不要在线上运行会增加次数的自动化脚本。

## 官方参考

- [本地测试密钥](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [控制台创建 Turnstile](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/)
- [服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Worker Secret](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler keep_vars](https://developers.cloudflare.com/workers/wrangler/configuration/)
