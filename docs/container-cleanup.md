# 合成容器释放与巡检

容器按 job ID 隔离。所有合成、修复输出写入 R2 后，runner 在 `compose:stop` Workflow step 中释放容器，再处理通知和上游成本记录。清理失败只记录错误，不改变成功交付或退款结果；step 使用 Workflow 的重试配置。外层异常路径使用独立清理 step，数据库不可用时也会尝试停止。

取消任务先写入取消状态并终止 Workflow，然后并发取消上游和释放容器。重复取消可再次尝试释放，退款仍由原有幂等账本保障。mock 模式不会调用真实容器绑定。

## 停止语义

`POST /_stop` 仅通过 COMPOSE binding 到达任务的 Durable Object，在转发到容器前处理。始终先调用原生 `destroy()`，不信任对象重启后的同步 running 标志。若 destroy 抛错，只在原生 `inspect()` 明确返回 null 时视为实例已停止；其余错误向调用方传播。停止和检查均不启动冷容器。

普通调用最多尝试三次，每次请求超时 5 秒，退避 100 / 500 毫秒。Workflow step 另有持久化重试；重试耗尽后由定时巡检兜底。`sleepAfter = 5m` 和容器内 SIGTERM 处理器保留为闲置停止兜底。

## 历史巡检

两个使用合成容器的站点每 15 分钟接收 scheduled 事件，通过 COMPOSE binding 访问名为 `container-maintenance` 的对象。复用已有 namespace，不新增 D1、R2 或迁移；维护对象只保存游标，不启动镜像。

每次最多扫描 50 个终态任务，终态直接使用共享 `TERMINAL`（包括 `canceled`），按主键 ID 做游标分页。游标保存在 Durable Object 存储中，重启后继续；到尾部后从头开始下一轮。页内单个停止失败计入 failed 并记录错误，继续其他任务，避免永久阻塞后续页面；下一轮会再次尝试失败任务，也会补扫在游标经过后才结束的任务。

因此完整巡检耗时随历史任务数增长，约为 `ceil(终态任务数 / 50) × 15 分钟`；整页恰好 50 条时还需要一次空页来确认到尾部。实时停止是主路径，巡检只作补偿。

公网 `/_reap` 对所有方法直接返回 404，不读取数据库、不返回任务 ID，也不调用容器。内部 `/_reap` 只由 binding 访问，响应仅含 scanned / stopped / failed 计数；stopped 表示已确认停止或已不存在，不表示本次杀死的活跃实例数。

## 验证与上线

- 本地 jobs 测试使用 workerd、内存 D1 和本地 R2，不访问真实生成服务。覆盖交付后停止、重放、退款、重复取消、越权取消、失败重试、超过 50 条的分页和游标后的终态变化。
- 站点构建后以 `wrangler dev --local` 验证 GET / POST `/_reap` 均为 404。真实容器及非 mock 定时巡检的本地验证需要 Docker 引擎与容器功能开启；关闭容器的本地运行不能验证原生 destroy / inspect。
- Windows 的 Docker Desktop 可直接构建项目镜像并验证真实 ffmpeg 合成、SIGKILL / SIGTERM、重复停止，以及停止后本地 R2 中的结果仍可读取。通过 Docker API 适配 stop hook 的测试只能证明本地停止链路；Wrangler 的容器引擎在 Windows 需要 WSL，Cloudflare 原生 destroy / inspect 和线上定时触发仍需另行验收。
- 生产部署必须从 main 按站点执行并取得确认。先部署一个站点，检查公网维护路径为 404、定时日志无异常，再做获准的受控生成，确认有声和静音输出均可访问，任务结束后活跃容器归零。
- 真实生成会发生上游和 Cloudflare 费用，需预先确定测试素材、任务数和费用预算。不要为了测试修改全站生产 mock 开关。
- 只读检查可在站点执行 `wrangler containers list` 与 `wrangler containers instances <application-id>`。stopped / inactive 的历史记录无需删除；删除记录不会抵扣之前已经发生的费用。
