/** Short combat notices: damage/danger cannot be overwritten by growth or recruitment. */
export class BattleNotice {
 text='';priority=0;remaining=0;
 push(text:string,seconds:number,priority:number){if(this.remaining>0&&priority<this.priority)return false;this.text=text;this.remaining=seconds;this.priority=priority;return true;}
 advance(dt:number){this.remaining=Math.max(0,this.remaining-dt);if(this.remaining===0)this.priority=0;return this.remaining>0?this.text:'';}
 clear(){this.text='';this.priority=0;this.remaining=0;}
}
