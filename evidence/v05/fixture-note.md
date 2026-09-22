# 夹具说明

360×780 / 390×844 的三位 Boss、觉醒、队友、整军选择和营地截图来自 browser-v05-fixture.mjs 的首段合成状态检查；这些不是自然通关证据。
第一次密集场景夹具加入临时敌兵 999 时遗漏了 level.obstacles 同步，渲染器查不到该临时对象的初始血量，夹具的 requestAnimationFrame Promise 未结束。中止并给夹具补齐数据与 24 秒超时保护。未更改游戏规则以通过测试。
使用 DENSITY_ONLY=1 仅重做尚未完成的密集段及其相邻边界检查，不重复跑三关。最终 fixture.json 是修正后的 18 秒记录。自然三关另见 delivery.json。
