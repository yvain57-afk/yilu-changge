# PR2素材制作记录

使用 image_gen，根据现有对应source PNG生成；旧素材与认可基线不覆盖。

- officer-actions-source.png：参考formal20260927/fronts-source.png，9人物×Wind/Strike/Rec，重做边缘留白后采用。切片为tools/pr2-art-slice.py；alpha连通提取并剔除相邻行靴子串片。
- portraits-source.png：参考既有写实三国画风，9个缺失身份；首稿帽冠贴边，二稿缩小留边采用。脚本3×3切片。
- rejected-runs-source.png：要求6兵器各4帧，同朝向、左右接地/经过、完整单兵器身份；输出第4列转身且古锭变双刀，拒绝接入。
- rejected-yield-source.png：参考formal20260927/enemies-source.png，9统帅跪姿献出各自兵器；输出张角顶部截断、典韦双戟融合成单柄，拒绝接入。

拒绝稿仅用于证明具体缺口。不是最终美术，不属于运行资源。源图和切片坐标已持久化，不依赖系统临时目录。
