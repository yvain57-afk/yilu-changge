# 山河长歌 · 音乐交付与验证

任务 MUSIC-SHANHE-20261004。**音乐文件、游戏接入、设置交互和构建已完成；原生实际发声未通过，不能称音乐全链路验收通过。**

## 直接使用

- 原地址试玩：http://127.0.0.1:43220/ 。刷新后点击游戏；设置里可开启背景音乐、切换30%/60%/90%音量。旧存档明确关闭音乐的选择保留，不强行开启。
- 试听与证据：http://127.0.0.1:43220/review/ 。两个音频播放器播放实际成品 MP3；它们不是原生实录。
- 若本地服务停止：项目根目录执行 `node tools/music-shanhe-20261004/serve.mjs`，端口43220；已有服务运行时不要重复启动。

## 实际内容

| 曲目 | 场景 | 长度与编配 |
|---|---|---|
| 静观山河 | 首页、营地、设置等非战斗界面 |102.4秒，75 BPM；木管、拨弦、舒展弦乐|
| 踏阵而行 | 战斗 |96秒，100 BPM；同一主题，短弦、圆号、行军鼓点|

两首共用原创八小节动机和和声语言，参考《故宫三部曲》宏阔、含蓄的东方器乐气质，没有采样、转写或引用原曲旋律。制作是原创 MIDI + FluidSynth 采样音源，不能冒称真人管弦乐录音。乐谱、源音色库、制作脚本和授权说明保存在 `art-source/music-shanhe-20261004/`。参考作品来源：[S.E.N.S 官方作品页](https://sens-company.com/sens/disco/details/details_sa019_palace_seeds.html)。音源授权全文包括历史采样来源说明，见源目录 GeneralUser-LICENSE.txt。

实际接入 `assets/resources/audio/shanhe/menu.wav`、`battle.wav`，44.1kHz/16bit/双声道PCM；游戏循环使用WAV，试听MP3有独立首尾淡化。连续三轮渲染取中间乐句以延续混响；数字边界差为0，无削波。这是技术检查，不等于主观听感通过。

场景切换平滑淡入淡出，已有主题不重复从头启动；暂停/切后台立即停声，返回后显式操作恢复。音乐和既有音效独立。保留二十关、视觉、战斗数值、玩家进度和原兵器音效。

## 版本与验证

- 版本0.12.8 / 2026100403；HEAD 79fbea0，原dirty工作树保留；本轮未提交、推送、发布或安装iPhone。
- 代码指纹 `0f9797bb89081d2980e7d59794eef69108bc18c22bc169daf69f97a6512a221c`；原生构建 `ios-6dafc87b64f1473e`；Web与原生源指纹一致。
- 针对性测试38/38、0失败；TypeScript检查通过；Web导出与原生模拟器Debug构建成功。日志在 `evidence/MUSIC-SHANHE-20261004/`。
- 实际Cocos模拟器750×1334画面；真实点击设置→关闭音乐→打开音乐→30%切60%→返回，运行状态回读对应变化。`settings-operation-silent.mp4` **明确无声**，仅证明营地→设置→关闭音乐这段实际UI交互；重新开启、调音量及返回有单独截图/状态回读，不在该片内；`settings-music-on.png/off.png` 对应本指纹。
- 较早自动场景切换的 `runtime-stage-*.png`、`runtime-samples.json` 属于同轮先前指纹a358ce9a…，不冒称最新代码证据。最新变化仅加入只读音频诊断。
- 全部既有音效文件、战斗/关卡/存档核心实现字节不变，见 preservation.json；音乐偏好存入已有设置存储，关闭选择保留。未访问真实iPhone存档或摄像头。

## 具体未通过与待验

1. **原生实际音频输出未通过。** Cocos菜单/战斗播放器加载成功，播放时间持续前进，实际音量非0；AVAudioSession为Ambient、Speaker、音量0.6，silencedHint=false。两种限定本游戏进程的CoreAudio录音都为0。用同一录音工具捕获afplay播放本曲，峰值0.226，证明录音工具可工作，但不能证明Cocos发声。原因未定位到；不称权限禁用，也不靠改系统权限/后期配音获得通过。
2. 浏览器实际听感、循环接点听感、iPhone静音开关/耳机/后台恢复与真机性能，仍待实际验证。未声称已替换手机或已通过真机听音。
3. 目前是采样乐器制作，两曲人声均无；真实民族乐器演奏、乐团录制不在本轮实现内。

## 开发入口

- `assets/scripts/formal/MusicDirector.ts`：场景主题、开关音量、生命周期和双轨交叉淡化。
- `assets/scripts/Platform.ts`：资源加载、AudioSource、音效独立、音频诊断。
- `assets/scripts/formal/FullMenu.ts`、`FormalGame.ts`：实际设置交互、场景接入及Debug验证样段。
- `native/engine/ios/AppDelegate.mm`：新增只读音频会话诊断，不改系统音频类别/权限。
- 原生候选：`build/ios-music-shanhe/proj/Debug-iphonesimulator/CocosGame.app`（模拟器，不是签名真机包）。
- 复现：`python3 tools/music-shanhe-20261004/compose.py`；构建命令见对应脚本。`capture.py`已加全静音拒收，不会把空音轨发布为听音证据。
