# Baby Dance AI

站点：<https://aibabydancing.com>。首页聚焦 `bonito bonito ai baby dance`；当前仅支持这一种舞蹈，不创建重复关键词落地页。以后确实支持多种舞蹈时，再将通用生成器与独立舞蹈页分开。

## 产品配置

以 `site.config.ts`、`site.models.ts` 和 `src/models.server.ts` 为准；页面可公开的价格与积分摘要由 `src/site/product.ts` 派生。

- 新账户获赠 10 积分，可生成一次 5 秒预览，需登录；赠送积分 7 天后过期，每个 IP 每天限一个新账户领取。
- 12 秒完整视频消耗 30 积分。套餐为 1 个 $6.99、3 个 $18.99、10 个 $55.99；购买的积分不过期，无订阅。
- Kling 4.0 reference 模式，compose 容器在生成后混入音轨，成品配置为 720×1280、30 fps、H.264 MP4。服务端参考片段、提示词和成本上限只存在于 `*.server.ts`。
- `minChange: 10` 已在服务端启用；端到端成功率、交付耗时和 12 秒实际成本仍需有授权的真实任务验证。

## 内容与媒体

- 四篇趋势指南保留各自搜索意图，并链接到有日期的来源；不能独立确认的平台标签明确归属于媒体报道，国籍差异不作武断判定。
- `/baby-dance-photo-guide`：选图、失败处理、照片处理与删除请求。
- `/baby-dance-example`：现有真实输出的独立观看页。经本地文件检查，该早期原始输出为 5.042 秒、496×864、24 fps、无音轨；它不是当前 compose 成品规格的演示，也不是成功率测试。
- `/about`：本站编辑责任、来源政策、联系及纠错方式。法律主体名称尚未核实，不虚构。
- `public/media/` 被 Git 忽略。构建和部署机器必须具备示例视频、海报、分享图片；`assets/baby-dance/` 下的参考视频和音轨在 R2，由服务端使用。
- 播放器使用已入库的 `public/posters/` WebP 海报（432×768，文件名带内容哈希）；替换时新增文件并更新 `src/site/posters.ts`，不能覆盖已有哈希文件。海报缓存一年，未版本化的 `/media/` 文件缓存一天。保留原 JPG 供现有结构化数据及外部链接使用。
- 视频统一 `preload="none"`；支持原生视频懒加载的浏览器延迟画廊加载，其他浏览器仍按需下载视频。仅首屏视频尝试自动播放；画廊按需播放，离屏或页面隐藏时暂停。保留 SSR 视频 URL 供发现。
- 歌曲及参考素材属于各自权利人；商业使用授权仍需运营者核实。本站的免责声明不替代授权。

## 统计与搜索平台

`site.config.ts` 已接入衡量 ID `G-LWBSELX9HW`（数据流 ID 为 `16245880791`，不用于网页标签）。更换账号时可配置 `ga4: 'G-…'` 或 `rybbit: { siteId: '…' }`；Rybbit 还需在 Worker 配置中设置实际 `RYBBIT_UPSTREAM`。这些统计 ID 为公开配置，不写入密钥。

`src/lib/track.ts` 将事件发送至已配置的 GA4/Rybbit，本地开发不发送统计，生产构建的本地预览也不会加载统计标签。部署环境使用 `APP_URL`（未设置时使用 `site.url`）判断统计是否启用；开发或本地预览的 `APP_URL` 应指向本地地址。事件覆盖上传开始、成功、失败，登录，购买，生成开始、完成及下载；不发送照片、文件名或邮箱。

漏斗从 `generator_view`（上传卡片至少 30% 可见）开始，依次观察 `upload_picker_open`、`photo_selected`、`upload_rejected`、`upload_started`、`upload_completed`、`generate_click`、`generate_started`、`result_ready`、`result_download`。`upload_rejected.reason` 区分文件格式和大小；选图器取消不会伪造选图事件。站内入口统一使用 `ui_location`，不再用 `source` 干扰营销来源。

视频自动播放记为 `sample_autoplay`，用户主动启动记为 `sample_play`；只有主动播放记录 `sample_progress` 的 25/50/75 百分比节点，每个播放器实例每个节点最多一次。进度节点表示播放位置，不作为精确观看时长。

运营者自测可访问 `https://aibabydancing.com/?analytics=off`：当前浏览器持久关闭 GA4 收集及自定义事件；访问 `?analytics=on` 恢复。偏好保存在该浏览器的本地存储，清除站点数据后需重新设置；不按国家过滤流量。外部推广链接应同时提供 `utm_source`、`utm_medium` 和 `utm_campaign`，不要给站内链接加 UTM。过去已收集的测试流量不会被此开关删除。

GSC 已通过 DNS 验证网域资源 `sc-domain:aibabydancing.com`，`/sitemap.xml` 提交状态为成功，发现线上现有的 12 个页面。Bing 已通过 CNAME 验证，同一 sitemap 的处理状态为成功，发现 12 个页面。两条验证 DNS 记录需保留；现有邮件 SPF 记录未修改。About、选图指南和真实输出观看页均已上线，sitemap 共包含 12 个页面；本次已向 GSC 和 Bing 重新提交同一地址。

后续由拥有账号权限的运营者完成：

1. 在 GSC 检查首页、指南和观看页的实时抓取与实际索引状态；提交成功不代表所有页面已编入索引。
2. 在 Bing Webmaster Tools 检查 sitemap 抓取及处理结果；有需要时再配置 IndexNow。
3. GA4 已将 `payment_confirmed`、`result_ready` 标为关键事件，不设置默认金额；已注册事件维度 `ui_location`、`reason`。在数据流增强型衡量中确认“网页加载”和“基于浏览器历史记录的页面更改”，在 DebugView 确认每次路由切换只有一次 page_view。部署后确认分析工具收到完整漏斗及来源数据，区分自然搜索、AI 来源和付费渠道；无法识别的来源不猜测归因。
4. 检查 Googlebot、Bingbot 与搜索抓取器未被 WAF 挑战拦截；伪装 User-Agent 的探测不能代替真实验证爬虫日志。
5. 按周查看查询、点击、生成成功与购买转化；固定问题集、地区、日期和模型记录 AI 引用情况，不能只看个别回答。

`llms.txt` 只是可选摘要，不作为搜索收录或排名保证。

页面/API 的生产域名 HTTP 请求由 Worker 308 跳转到 HTTPS，保留路径、查询和请求方法；本地 HTTP 预览不跳转。静态资源由 Cloudflare assets 优先响应，不经过该跳转逻辑。域名级 Always Use HTTPS 已于 2026-11-05 启用，实测页面与静态资源均返回 301 并保留查询参数；应保留该设置。Sitemap 与文章结构化数据通过 `src/site/page-dates.ts` 记录各页实际修改日期，不随每次部署统一刷新。

## 验证与待核实项

本地运行 `pnpm --filter @shipwords/site-baby-dance check`。预览只用于审阅；生产部署必须遵循仓库要求，从 main 单站部署并取得明确确认。

- 核实 R2 uploads 生命周期是否确实为隐私政策所述的两天；本轮未改远程配置。
- 使用获得授权的照片补充正面、侧脸、坐姿三组真实测试，记录样本条件、耗时、最终文件参数、费用和失败原因，再发布统计。
- 核实素材许可、实际运营主体、支持邮箱收件能力、支付测试及退款链路；本轮不执行付费生成或支付。
