import { Level, Row, Obstacle } from './model';
const add = (value: number) => ({kind:'add' as const, value});
const double = {kind:'double' as const, value:2};
const row = (id:number, at:number, n:number, reverse=false):Row => ({id,at,left:reverse?double:add(n),right:reverse?add(n):double});
const obstacle = (id:number,at:number,x:number,kind:Obstacle['kind'],hp:number,loss:number,width=.29):Obstacle => ({id,at,x,kind,hp,loss,width});
export const LEVELS:Level[] = [
 {id:0,title:'渡口送简',era:'战国 · 第一页',duration:46,start:8,bossHP:1100,bossLoss:7,
 rows:[row(1,6,12),row(2,15,18,true),row(3,26,26),row(4,37,34,true)],
 obstacles:[obstacle(1,12,.48,'wood',22,12),obstacle(2,21,-.48,'rock',999,10),obstacle(3,25,.48,'wood',35,16),obstacle(4,32,-.48,'ink',1,9),obstacle(5,40,.48,'rock',999,14)],
 intro:['渡口的阿禾：这一束竹简，能捎给对岸的阿兄吗？','纸雀：手指左右拖，纸兵会跟着你，箭会自己往前飞。'],
 ending:'竹简送到了，渡口多留了一盏等人回家的灯。',
 clue:'【虚构】阿禾托你送竹简，纸雀和纸兵都来自残缺史书的幻想力量，并非战国纸张已普遍使用的证据。【历史背景】战国楚地已有竹简书写，存世竹书保存了思想与典籍材料。本关借“送简”讲牵挂，不复原某次真实递送；渡口位置、人物衣饰与竹简所写内容均为艺术设定，具体形制待考。',
 source:'清华大学《千年竹简与百年清华的相遇》',url:'https://www.tsinghua.edu.cn/info/2035/70732.htm'},
 {id:1,title:'关道护粮',era:'西汉 · 第二页',duration:60,start:8,bossHP:1900,bossLoss:11,
 rows:[row(1,6,16),row(2,17,22,true),row(3,29,30),row(4,41,36,true),row(5,52,44)],
 obstacles:[obstacle(1,13,.48,'wood',30,16),obstacle(2,23,-.48,'rock',999,18),obstacle(3,28,.48,'wood',55,25),obstacle(4,35,.48,'ink',1,14),obstacle(5,40,-.48,'wood',64,22),obstacle(6,47,-.48,'rock',999,20),obstacle(7,55,.48,'ink',1,16)],
 intro:['炊人阿麦：粮到了，灶上的水才不算白烧。','纸雀：翻过数百年，这次走西汉关道；先射开木栅，再选门。'],
 ending:'粮车停在灶边，远行的人终于赶上了一顿热饭。',
 clue:'【虚构】阿麦、粮车和护送之旅是原创故事；粮车只承载叙事，没有独立血条。【历史背景】悬泉置汉简留下驿置接待、粮食出入与日常事务的记录，让宏大交通网络背后的吃饭与劳作可被看见。本关借此想象关道上的一顿饭，并非复原某条运输路线；车辆、服饰和关门细部仍属待考的简化美术。',
 source:'甘肃文博会《悬泉置：驿站小人物与历史大事件》',url:'https://www.gswbj.gov.cn/a/2019/11/01/3487.html'},
 {id:2,title:'长街寻信',era:'唐 · 第三页',duration:74,start:8,bossHP:2000,bossLoss:15,
 rows:[row(1,6,18),row(2,18,24,true),row(3,31,32),row(4,44,42,true),row(5,57,50),row(6,67,56,true)],
 obstacles:[obstacle(1,14,.48,'wood',36,20),obstacle(2,24,-.48,'ink',1,15),obstacle(3,30,.48,'wood',70,27),obstacle(4,38,-.48,'rock',999,25),obstacle(5,43,-.48,'wood',85,28),obstacle(6,50,.48,'ink',1,20),obstacle(7,56,.48,'wood',100,32),obstacle(8,63,-.48,'rock',999,28),obstacle(9,70,.48,'ink',1,22)],
 intro:['补衣人小满：信还没到，他会不会以为家里没人等？','纸雀：又翻过数百年，已是唐时；替无名的人，把牵挂找回来。'],
 ending:'家书里没有壮阔功业，只有一句：饭还热着，等你。',
 clue:'【虚构】小满与遗失家书的情节为原创，墨影象征残页的失序，不指代真实人物或族群。【历史背景】敦煌吐鲁番书信文献保留了问候、报平安及封题等线索，唐代书信也承载日常往来。本关长街并非某座城市的精确复原，建筑、服饰和邮递细节待考；信中文字是今人创作，不冒称出土原文。',
 source:'王启涛《中国社会科学网：秦汉简牍对敦煌吐鲁番文献研究的重要性》',url:'https://www.cssn.cn/lsx/lsx_zgs/202210/t20221024_5552518.shtml'}
];
