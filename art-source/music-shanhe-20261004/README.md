# 山河长歌 · 原创游戏音乐

本项目当前用户于 2026-10-04 明确允许恢复音乐，参考《故宫三部曲》的宏阔、含蓄、东方器乐气质。本次没有下载、采样、转写或引用其旋律；只查阅了官方作品页确认所指系列：
https://sens-company.com/sens/disco/details/details_sa019_palace_seeds.html

两首作品共用 compose.py 中原创八小节主题、D 小调／五声音阶骨架与八小节和声循环。
- 静观山河（menu）：75 BPM，32 小节，102.4 秒。木管、拨弦、弦乐及极轻鼓点，营地／设置等非战斗页面。
- 踏阵而行（battle）：100 BPM，40 小节，96 秒。相同动机，短弦律动、圆号应答、低鼓与太鼓，战斗页面。

制作方式是原创 MIDI 乐谱与采样音源渲染，不是云端作曲或真人乐团录音。FluidSynth 2.6.1；GeneralUser GS 2.0.3，S. Christian Collins，官方网站 https://www.schristiancollins.com/generaluser ，源仓库 https://github.com/mrbumpy409/GeneralUser-GS 。完整授权条款（含作者对部分历史采样来源的不确定说明）保存在 GeneralUser-LICENSE.txt；条款允许私人及商业音乐制作。未另行证明每个底层采样的来源。游戏只装载渲染音乐，不打包音源库。

复现：python3 tools/music-shanhe-20261004/compose.py。MIDI 连渲染三轮，截取中间完整乐句，保留上一轮混响尾；最后 48 个采样做边界校正。游戏使用 44.1kHz / 16-bit / stereo PCM WAV，避免压缩编码填充导致循环空隙；试听 MP3 单独加首尾淡化，不作为游戏循环文件。

score.json 记录主题、各轨速度、时长、采样帧数、电平和哈希。旧音效/旧 music.mp3 未覆盖。原音源 31MB 留在本源目录用于可复现制作。
