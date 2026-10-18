/** World labels keep category readable at distance and disclose contents near pickup. */
export function crateLabelPlan(category:string,content:string,z:number,measure:(s:string,n:number)=>number){
 const detailed=z<=12;
 if(!detailed)return {detailed,lines:[category],w:Math.max(52,measure(category,12)+16),h:26};
 const lines:string[]=[];let line='';
 for(const ch of content){if(line&&measure(line+ch,12)>116){lines.push(line);line=ch;}else line+=ch;}
 if(line)lines.push(line);
 const w=Math.min(132,Math.max(84,measure(category,11)+16,...lines.map(s=>measure(s,12)+16)));
 return {detailed,lines,w,h:30+lines.length*17};
}
