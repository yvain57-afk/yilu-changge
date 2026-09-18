# 《一路长歌》执行进度

## 最新用户反馈与当前任务（先读此处）
- 用户明确反馈：界面太丑、故事情节不好、文案不对。当前版本是待重做工程基线，界面/故事/文案未通过用户验收。
- 当前指令：新建GitHub仓库上传当前项目，让GPT查看和给改进建议。本轮先做仓库与评审入口，不擅自开始新一轮游戏改造。
- 已核实账号yvain57-afk；拟用仓库名yilu-changge。本地初始无.git，准备保留完整源码、原创素材、截图及验证资料。
- 已整理docs/GPT_REVIEW.md，README前置用户反馈及评审入口。依赖、缓存、下载包和本地release压缩包不入库。
- 公开尚未获确认，按先前边界创建私有仓库 https://github.com/yvain57-afk/yilu-changge 并上传。游戏上架、Pages部署、商业化仍未授权。
- 本机gh认证可读仓库，远端main与本地提交ebe2d2f一致；当前GitHub连接器读取新私有库返回404，尚不能宣称GPT已能直接读库，见BLOCKED B-04。

## 首版技术基线（历史实测，不代表体验通过）
- 浏览器三关可玩，真实Cocos 3.8.8双平台构建均退出36；入口 http://127.0.0.1:43187 。
- 最终规则18通过/跳过0；重复门故障被检出；8项边界通过；实际失败后免费重开8兵，线索经失败、重开、刷新仍保留。
- 连续十局全通过，平均54.20–60.00 FPS，最低一秒采样40；分关节点峰值98/109/118，结算均18。浏览器页面异常0、外部请求0。
- 交付目录release：源码、浏览器包、真实微信包、证据ZIP及SHA256；详细记录docs/VERIFICATION.md，亲验说明docs/PLAYTEST.md。
- 尚不能宣称整体验收完成：微信AppID/开发权限与真机、用户体验待验；历史工具临时缓存路径偏差详列BLOCKED.md。
- 微信仍不得借业务AppID；不因新建源码仓库而自动授权游戏上架或改变冻结规则。


## 恢复入口
中断或新会话先读本文件及 BLOCKED.md。唯一工程路径 `/Users/yvainair/Code/游戏-左右滑古代史`。单执行者，不委派 agent。用户任务书为验收依据；不得降低断言、跳过测试、伪装引擎产物。

## 当前阶段：任务 0
- 2026-09-18：`pwd -P` 返回上述真实路径；`ls -ld` 为普通目录；`rg --files --hidden -g '!node_modules' -g '!.git' <项目>` 退出 1、无输出，空目录基线。
- 已读 `/Users/yvainair/.codex/AGENTS.md`、`/Users/yvainair/Code/AGENTS.md` 和用户规则。
- `.write-probe` 最小写入退出 0，读回原文成功。旧任务拦截本次未复现。
- 可用：Apple Silicon arm64，Node v22.23.1，npm 10.9.8，Python3，Chrome CDP；可用磁盘约 363GiB。`/Applications` 未见 Cocos；微信开发者工具 CLI `--help` 退出 0。
- 官方核验：3.8.8 发布及下载页 https://www.cocos.com/creator-download ；官方补丁下载 https://forum.cocos.org/t/topic/172319?page=6 。
- 官方构建入口：`CocosCreator --project <path> --build "configPath=<json>"`；成功退出码 36、失败 32/34。来源 https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html 。尚未执行构建，不能声明通过。

## 顺序与决策
1. 安装核实官方 3.8.8，建立可复现引擎工程和冻结验收用例。
2. 规则、平台、绘制分离；固定步长；先首关真实构建闭环。
3. 原创人物、三关脚本及史料、三关视觉和十二章总纲；扩展三关及界面音频。
4. 逻辑、反向故障、真实引擎浏览器验收、十局测量、微信构建与可完成的平台检查。
5. 交付可访问入口、源码、素材、说明与各平台实测证据。体验和无条件的真机项单列未验证。

## 下一步
下载并检查官方编辑器归档与版本，安装到官方默认目录。所有项目依赖、缓存和构建保存在工程内；不借用业务 AppID、不公开发布。

## 工具与规则进展
- 官网 HTML 中提取正式包 `https://download.cocos.com/CocosCreator/v3.8.8/CocosCreator-v3.8.8-mac-121518.zip`，下载退出 0，安装于 `/Applications/CocosCreator/Creator/3.8.8/CocosCreator.app`。论坛补丁 HEAD 403 后改用官网正式包，未反复重试。
- `plutil -extract CFBundleShortVersionString raw .../Info.plist` 输出 3.8.8；`codesign -dv` 显示 com.cocos.creator、universal arm64/x86_64、TeamIdentifier NQ596S94Q5。
- 项目依赖安装成功（14 packages，缓存 `.cache/npm`）；已建立 `docs/ACCEPTANCE.md` 冻结 R01–R12/C01/E01。
- 已写纯 TypeScript 固定步长模型、三关配置及存档边界；`npm run typecheck:core` 初次发现类型收窄/索引错误，修复后退出 0。尚未运行规则测试或游戏。
- 美术执行决定：全部在工程内原创可编辑 SVG 绘本插画并导出 PNG，避免内置生成器默认在工程外落盘；定位为原创简化美术，最终绘本气质仍待用户亲验。
- 下一步：依据已安装编辑器自带 2D 模板建立正式场景、开始首关引擎构建；补齐模型验收和原创素材。

## 规则与首轮引擎检查
- 18项规则验收全通过，skip/todo均0；日志 `evidence/rules-test.log`。可通路线模型时长 59.92/75.92/90.42 秒（不是浏览器实测）。
- `node tools/mutation.mjs` 临时夹具去掉门结算保护：同条R02断言报 `256 !== 20`；负向日志1项失败、skip/todo 0。夹具删除，正式规则源码未修改；重跑18项通过。
- 原创3张分层场景、旅人/纸雀/纸兵/木栅/山石/墨影/粮车均有 `art-source/*.svg` 与 PNG；6份原创合成WAV已生成，无商业素材、无生成器外部落盘。
- `node tools/build.mjs web-mobile` 实际启动3.8.8，首次退出36但有 Missing class，不能算试玩通过。按编译器生成的压缩脚本UUID修正，第二次无该问题。
- 首次浏览器运行发现 PNG 默认导入为 texture，无 spriteFrame 子资源；依据实际 meta 改为加载 Texture2D 再创建 SpriteFrame，正在重构建，保留失败原因。
- TypeScript编辑器全库检查遇到官方声明缺失（GPU等），项目检查限定 assets/scripts，skipLibCheck仅排除外部.d.ts内部错误，项目strict=true；发现并修复getID可空类型。测试标准未变。
- 本地默认4173端口已占用，未干扰原进程；试玩服务器改为仅绑定127.0.0.1:43187。仅服务真实Cocos产物，不另写网页游戏。

## 浏览器与微信的真实结果（阶段记录，未最终验收）
- 浏览器首关通过入口→跳对白→战斗→守关→结算，真实62.17秒，平均59.93FPS，采样最低57.05FPS，节点峰值98、结果18。后续第二关自动控制遭落墨失败，已保留失败截图，未判三关通过。
- 手机390×844自动触控测试初次点击误差来自测试坐标把SHOW_ALL上下留白算入游戏高度；已改为等比最小缩放和居中映射，不修改游戏验收标准。
- 检查Cocos input.ts确认引擎已经把鼠标模拟为触摸，移除游戏重复鼠标监听，统一单指路径；继续记录输入轨迹定位自动避让失败。
- 真实微信构建退出36；空appid曾被编辑器自动回填官方示例AppID，该包未用于开发者工具或上传。配置改touristappid后重构建，检查产物确为游客占位。
- 微信CLI打开游客包返回code10「不存在此 AppID」，见 BLOCKED B-01；无专用身份不继续尝试、不借用业务身份。
- 发现编辑器最初默认把自身构建引擎缓存放系统临时目录，后续构建显式TMPDIR指向工程 `.cache/tmp`。工程文件、依赖、艺术源、浏览器测试profile及证据均在唯一工程内；此默认编辑器副作用如实保留，不声称完全零外部缓存写入。
- 已完成原创人物三关脚本 `docs/STORY.md`、12章总纲 `docs/TWELVE-CHAPTERS.md`、史料底稿 `docs/HISTORY-SOURCES.md` 和架构说明。

## 后台验收诊断
- 手机尺寸边界脚本已通过坏档、3个设置恢复、跳对白、真实触摸移动；后台切页连续失败3次后暂停该做法并先完成三关通关与资料。
- 新证据：实际打印 `document.hidden=false, visibility=visible, focused=true`，证明测试切页没有把网页置入后台，不能据此判定生命周期实现失败。
- 检索已安装Playwright源码 `node_modules/playwright-core/lib/server/chromium/crPage.js:446` 发现默认启用 `Emulation.setFocusEmulationEnabled`。改用真实CDP关闭测试器焦点仿真后再切页，先断言网页实际hidden=true，再验暂停；不伪改document.hidden或游戏状态。
- 最终微信构建已使用TMPDIR工程内缓存，产物游客AppID校验通过；仍被专用身份缺失阻塞开发者工具/真机。

## 三关闭环与包体收尾
- 真实浏览器三关连续走通（修复输入后）：59.92/74.42/99.42秒，平均59.90/56.40/60.00FPS，节点峰值98/108/122，结算均18，截图和输入轨迹在evidence。第三关实际路线有折损，故比模型约90秒长，未设硬超时。
- 去除重复鼠标监听后第一关与模型160兵一致。新增显式浏览器blur/visibility及微信onHide/onShow适配，平台隐藏事件重复到达为幂等暂停。
- 背景测试关闭Playwright焦点仿真后已观察focused=false、screen=pause；但该工具创建独立可见窗口，hidden仍false，保留严格hidden断言，改为最小化自有测试窗口再检验，不降低断言。
- 正式构建改debug=false/sourceMaps=false。原创纹理调色板压缩、WAV原稿保留art-source/audio，运行音频以ffmpeg压成MP3；运行素材约0.5MB，生成源不丢失。
- 首关史料改用已完整读取的清华大学官方文章，湖北馆页面访问失败只保留为检索线索，不当作已读正文依据。

## 原生后台验收通过
- `node tools/browser-lifecycle.mjs` 使用独立Chrome原生CDP，不启用Playwright焦点仿真；实际得到 hidden=true、visibility=hidden、focused=false、screen=pause。
- 回到该页仍停在pause，等待700ms进度不变；点击继续后进度恢复。日志 `evidence/browser-lifecycle-console.log`、结果 `evidence/browser-lifecycle.json`、截图 `evidence/lifecycle-native.png`。
- 原隐藏断言保持，边界测试调用该原生子进程并再次断言真实hidden与暂停/显式继续结果，其他输入/存储检查继续使用Playwright；没有伪改document.hidden或替换游戏逻辑。
- 正式压缩浏览器构建退出36、2.3MB。守关预告池改固定ID以防长局坐标不断产生标签；诊断快照深拷贝保证无可写游戏引用。

## 重开验收捕获的构建差异
- 边界测试继续到5次重开时，count=8正确而诊断usedRows.length=1，未跳过断言。
- 实际构建JS显示 `usedRows:[].concat(t.usedRows)`，旧轨迹为 `[{}]`：Cocos松散编译把Set展开当数组。源改为 `Array.from(j.usedRows)`，保留原断言复测。
- 门可视宽度补至中线，与按中心左右判定一致，避免中心留缝却得到右门收益的视觉歧义。
- 背景原生测试与Playwright边界测试改为顺序运行；不再在一个正在自动操作的浏览器中启动另一个浏览器，以免焦点及资源竞争干扰取证。

## 存储边界修复与最终稳定性测试
- 原生浏览器故障注入发现：Cocos sys.ts在初始化存储异常时换成不抛错的空实现，平台用sys.localStorage会丢失写失败信号。
- 浏览器适配改用window.localStorage，异常仍由真实Book处理；微信保持wx存储。没有放宽断言或更换被测逻辑。
- `npm run typecheck`、`npm run typecheck:core`通过；`npm test` 18通过、fail/skip/todo均0。
- 浏览器与微信最终源码重构建原始退出码36。原生后台通过；`npm run test:edge` 8项通过、pageerrors 0，包含真实Storage写失败提示且继续开战。
- 测试新页曾停在Cocos启动页超时；显式激活自有测试页后正常，未改游戏时间规则或等待断言。
- 现在顺序执行最终10局真实浏览器输入测试；完成后汇总帧率、节点、截图和交付归档。微信身份及目标手机、用户体验仍待验。

## 工具临时目录补充审计
- 读取实际依赖源码确认Playwright browserType.js使用os.tmpdir创建artifacts目录，tsx temporary-directory模块使用系统tmp；早期npm run未统一配置日志缓存。原来只记录编辑器缓存的审计不完整，已补入BLOCKED.md。
- 新增 `.npmrc` 与 `tools/run-local.mjs`，后续npm测试子进程TMPDIR/TMP/TEMP与npm缓存均指向本工程。当前正在运行的十局进程已在修正前启动，不重写这段历史。未为擦除记录去清理可能共享的系统缓存。
- 游戏源和构建没有变化，十局继续。之后失败路线验证使用新包装器，并在交付说明明确本次路径约束存在实际偏差。

## 最终十局通过
- `npm run test:browser` 退出0，10局全部获胜。三关时长约60/75/90秒；平均FPS 54.20–60.00，最低一秒采样40，没有持续低于30 FPS。
- 分关节点峰值固定98/109/118，池峰值83/94/103，10次结算均18节点、箭矢0，无持续累积。pageerrors=0，游戏页面外部请求=0。
- 原始完整结果 `evidence/browser-runs.json`，十份 `browser-trace-*.json`，battle/result截图保留。桌面Apple M5结果不等于目标手机验收。
- 新工具包装器临时目录检查通过。最后执行反向故障、正式18项与类型检查确认包装器可用，再通过真实输入走一条失败路线补验线索不丢与免费重开。

## 失败路线与交付核验
- `npm run test:failure` 通过，真实输入89.48秒因「未避开守关墨影的落墨」归零失败。结果点击免费重开恢复8兵，线索在失败、重开、刷新后仍保留；pageerrors=0。
- 工具路径包装器下重新执行反向故障检出，再跑正式18项全部通过，fail/skip/todo=0；core与Cocos项目类型检查退出0。
- 两平台全部输出文件散列在最终浏览器验证期间未变化。分平台报告已由原始证据生成，不用构建代替试玩。
- 源码、三关内容、美术/音频源、视觉稿、十二章总纲与复现说明就绪；交付打包逐份CRC及SHA256检查，结果以release/manifest.json为准。
- 四份ZIP已生成，逐份读回CRC通过，SHA256写入release/manifest.json与SHA256SUMS。浏览器包54文件，微信包59文件，源码111文件，证据70文件。
- 本机试玩服务仍运行于127.0.0.1:43187；已向Codex请求显示入口（工具返回queued，未将UI已显示当作额外试玩证据）。所有可独立工作已交付，后续验收条件见BLOCKED.md。
