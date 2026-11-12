import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';
const dir = 'D:/L/Codex Space/same world/outputs/heji-maintenance-20261031';
const source = JSON.parse(await fs.readFile(`${dir}/source.json`,'utf8'));
const detail = JSON.parse(await fs.readFile(`${dir}/details.json`,'utf8'));
const raw = source['地图项目样例'].slice(4);
assert.equal(raw.length, detail.people.length);
assert.equal(raw.length, detail.channels.length);
assert.equal(source['地图项目样例'][3][10],'10. 参与方式');
const wb = Workbook.create();
const names = ['项目汇总','项目人物','参与方式','待核验'];
const sheets = names.map(n=>wb.worksheets.add(n));
const id = i => `HJ-${String(i+1).padStart(3,'0')}`;
const serial = s => s ? (Date.parse(`${s}T00:00:00Z`)-Date.UTC(1899,11,30))/86400000 : null;
const people = [], channels = [];
raw.forEach((p,i)=>{
  detail.people[i].forEach(([name,type,role])=>people.push([
    `PR-${String(people.length+1).padStart(3,'0')}`,id(i),null,name,type,role,
    '原表线索','在册',null,`v3：地图项目样例!G${i+5}；项目公开来源见项目汇总。`,
    role.includes('待') ? role : '身份及与项目的关系待逐条核验'
  ]));
  detail.channels[i].forEach(([type,platform,entry,product,how,url,evidence,date,todo])=>{
    if(url==='SOURCE_DOUYIN') url=p[10].match(/https:\/\/www\.douyin\.com\/\S+/)[0];
    channels.push([`PA-${String(channels.length+1).padStart(3,'0')}`,id(i),null,type,platform,entry,product,how,url,
      evidence,'待确认','在册',serial(date),null,
      `v3：地图项目样例!K${i+5}${date?'；用户截图与确认 '+date:''}；项目公开来源见项目汇总。`,todo]);
  });
});
const projects = raw.map((p,i)=>[id(i),p[0],null,null,null,p[1],p[5],p[7],p[8],p[9],p[11],p[12],p[2],p[3],p[4],p[13]]);
const taskMap = ['HJ-001','HJ-003 / HJ-004','HJ-011','HJ-012','HJ-013','HJ-014',null,null,null,null,'HJ-006','HJ-010','HJ-007','HJ-006','HJ-006','HJ-006'];
const pending = source['待核验'].slice(1).map((r,i)=>[`T-${String(i+1).padStart(3,'0')}`,taskMap[i],r[0],r[1],r[2],r[3],'待处理',null]);
pending.push([`T-${String(pending.length+1).padStart(3,'0')}`,'HJ-009','墨脱背夫影视资料','寻找墨脱背夫相关纪录片／影视资料','原表参与方式中的待办需求','核实片名、制作机构、涉及背夫的集数及正版观看入口','待处理',null]);
pending.push([`T-${String(pending.length+1).padStart(3,'0')}`,'HJ-006 / HJ-012','人物称呼对应','爱侬日“高婶”与东北项目“张婶”是否同一人','未核实前保留两条项目关系，避免错合并','回查节目字幕或用户记录，核准姓名与称呼','待处理',null]);
const specs = [
  {title:'禾伙人助农公益地图 · 项目汇总',note:'项目编号固定不变。人物和参与入口在明细表维护；C—E 列自动统计明细表前1000条在册记录。',note2:'新增项目分配新编号；新增明细复制上一条表格行，再填写新记录编号和项目编号。来源口径沿用 v3。',headers:['项目编号','项目名称','在册对象数','在册参与记录','已确认可参与','项目地点','节目节点','问题','十个勤天做了什么','当地有什么','金句文案','当前状态／后续结果','纬度','经度','坐标精度','来源及原核验口径'],rows:projects,widths:[14,36,13,16,16,45,38,55,65,45,48,55,14,14,25,100],table:'Projects'},
  {title:'项目人物 · 一条项目关系一行',note:'同一人物参与多个项目，分别建关联记录；未具名群体按“群体”保留。项目名称自动关联。',note2:'原表线索不代表已逐条核验。删除错误记录；已结束的关系可改为“已归档”。最后核验日期按实际填写。',headers:['关系编号','项目编号','项目名称','姓名／称呼／对象','对象类型','身份及与项目的关系','核验状态','记录状态','最后核验日期','来源定位','待补充'],rows:people,widths:[15,14,36,30,14,55,17,15,17,55,48],table:'People'},
  {title:'参与方式 · 一个入口一行',note:'不同平台、店铺或活动入口分别建行；同一入口的多个产品可以放在一起。项目名称自动关联。',note2:'本次仅迁移，入口有效性统一“待确认”。渠道补充日期与最后核验日期分开；保留历史记录请用“已归档”。',headers:['参与编号','项目编号','项目名称','参与类别','平台／场景','店铺／活动／入口','相关产品／内容','参与步骤及限制','链接','核验状态','有效状态','记录状态','线索补充日期','最后核验日期','来源定位','待补充'],rows:channels,widths:[15,14,36,16,20,35,44,60,65,17,17,15,17,17,55,45],table:'Participation'},
  {title:'待核验 · 原有待办与迁移问题',note:'原有待核验信息完整保留。候选项目暂不分配正式项目编号；跨项目问题可列出多个编号。',note2:'资料迁移日期：2026-10-31。原文件：outputs/heji-project-fill-20260911/禾伙人助农公益地图_项目汇总_v3.xlsx。',headers:['待办编号','关联项目编号','事项','还缺什么','为什么重要','下一步','处理状态','完成日期'],rows:pending,widths:[15,28,35,85,65,100,16,17],table:'Pending'}
];
function col(i){let x='';for(i++;i;i=Math.floor((i-1)/26))x=String.fromCharCode(65+(i-1)%26)+x;return x;}
function lineCount(value,width){return String(value??'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil([...line].reduce((s,c)=>s+(c.charCodeAt(0)>255?2:1),0)/(width-2))),0);}
specs.forEach((spec,i)=>{
  const s=sheets[i], end=spec.rows.length+6, last=col(spec.headers.length-1);
  s.showGridLines=false;
  s.getRange(`A1:${last}${end}`).format.font={name:'微软雅黑',size:10,color:'#26372A'};
  s.getRange('A2').values=[[spec.title]];s.getRange('A2').format.font={name:'微软雅黑',size:14,bold:true,color:'#214936'};
  s.getRange('A3').values=[[spec.note]];s.getRange('A4').values=[[spec.note2]];
  s.getRange('A3:A4').format.font={name:'微软雅黑',size:10,color:'#657265'};
  s.getRange(`A6:${last}${end}`).values=[spec.headers,...spec.rows];
  s.tables.add(`A6:${last}${end}`,true,spec.table);
  s.getRange(`A6:${last}6`).format={fill:'#2D5941',font:{name:'微软雅黑',size:10,color:'#FFFFFF',bold:true},rowHeight:32,wrapText:true,horizontalAlignment:'center',verticalAlignment:'center'};
  s.getRange(`A7:${last}${end}`).format.wrapText=true;
  s.getRange(`A7:${last}${end}`).format.verticalAlignment='top';
  spec.widths.forEach((w,j)=>s.getRange(`${col(j)}1:${col(j)}${end}`).format.columnWidth=w);
  spec.rows.forEach((row,j)=>{
    const h=Math.max(42,...row.map((v,k)=>lineCount(v,spec.widths[k])*14+10));
    if(h>409) throw new Error(`Text too long ${spec.table} row ${j+7} height ${h}`);
    s.getRange(`A${j+7}:${last}${j+7}`).format.rowHeight=h;
    if(j%2===1)s.getRange(`A${j+7}:${last}${j+7}`).format.fill='#F1F5EF';
  });
  s.freezePanes.freezeRows(6);s.freezePanes.freezeColumns(i===0?2:3);
});
for(let i=0;i<raw.length;i++){
  const r=i+7;
  sheets[0].getRange(`C${r}:E${r}`).formulas=[[
    `=COUNTIFS('项目人物'!$B$7:$B$1006,A${r},'项目人物'!$H$7:$H$1006,"在册")`,
    `=COUNTIFS('参与方式'!$B$7:$B$1006,A${r},'参与方式'!$L$7:$L$1006,"在册")`,
    `=COUNTIFS('参与方式'!$B$7:$B$1006,A${r},'参与方式'!$L$7:$L$1006,"在册",'参与方式'!$K$7:$K$1006,"可参与")`
  ]];
}
for(const [s,rows] of [[sheets[1],people],[sheets[2],channels]]){
  rows.forEach((_,i)=>s.getRange(`C${i+7}`).formulas=[[`=IF(B${i+7}="","",IFNA(INDEX(Projects[项目名称],MATCH(B${i+7},Projects[项目编号],0)),"项目编号未匹配"))`]]);
  s.getRange('B7:B1006').dataValidation={rule:{type:'list',formula1:"'项目汇总'!$A$7:$A$1006"}};
  s.getRange(`C7:C${rows.length+6}`).format.font.color='#356D91';
  s.getRange('C7:C1006').conditionalFormats.add('containsText',{text:'项目编号未匹配',format:{fill:'#FCE4D6',font:{color:'#9C2929'}}});
}
function list(s,range,values){s.getRange(range).dataValidation={rule:{type:'list',values}};}
list(sheets[1],'E7:E1006',['个人','群体','团队','组织']);
for(const [s,c] of [[sheets[1],'G'],[sheets[2],'J']])list(s,`${c}7:${c}1006`,['原表线索','用户提供','公开资料核实','待核验','有冲突']);
list(sheets[1],'H7:H1006',['在册','已归档']);
list(sheets[2],'K7:K1006',['待确认','可参与','季节性开放','暂时关闭','已结束']);
list(sheets[2],'L7:L1006',['在册','已归档']);
list(sheets[3],'G7:G1006',['待处理','核验中','已完成','暂缓']);
sheets[1].getRange(`I7:I${people.length+6}`).setNumberFormat('yyyy-mm-dd');
sheets[2].getRange(`M7:N${channels.length+6}`).setNumberFormat('yyyy-mm-dd');
sheets[3].getRange(`H7:H${pending.length+6}`).setNumberFormat('yyyy-mm-dd');
sheets[0].getRange(`M7:N${raw.length+6}`).setNumberFormat('0.00000');
sheets[0].getRange(`C7:E${raw.length+6}`).format.font.color='#356D91';
// Verify relationships and live aggregation, including adding one record then restoring.
wb.recalculate();
assert.deepEqual(sheets[0].getRange('C7:D7').values,[[detail.people[0].length,detail.channels[0].length]]);
const beforeCount=sheets[0].getRange('D7').values[0][0];
const testRow=channels.length+7;
sheets[2].tables.items[0].rows.add(null,[['TEST','HJ-001',null,'测试',null,null,null,null,null,'待核验','可参与','在册',null,null,null,null]]);
wb.recalculate();
assert.equal(sheets[0].getRange('D7').values[0][0],beforeCount+1);
assert.equal(sheets[0].getRange('E7').values[0][0],1);
// Remove only the temporary table, recreate its original boundary, and clear test data.
sheets[2].tables.items[0].delete();
sheets[2].getRange(`A${testRow}:P${testRow}`).clear({applyTo:'contents'});
sheets[2].tables.add(`A6:P${channels.length+6}`,true,'Participation');
// Reapply formulas after table recreation to refresh structured-reference bindings.
for(let i=0;i<raw.length;i++){
  const r=i+7;
  sheets[0].getRange(`D${r}:E${r}`).formulas=[[
    `=COUNTIFS('参与方式'!$B$7:$B$1006,A${r},'参与方式'!$L$7:$L$1006,"在册")`,
    `=COUNTIFS('参与方式'!$B$7:$B$1006,A${r},'参与方式'!$L$7:$L$1006,"在册",'参与方式'!$K$7:$K$1006,"可参与")`]];
}
wb.recalculate();
for(let i=0;i<raw.length;i++)assert.deepEqual(sheets[0].getRange(`C${i+7}:E${i+7}`).values,[[detail.people[i].length,detail.channels[i].length,0]]);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#SPILL!',options:{useRegex:true,maxResults:20},maxChars:1500})).ndjson);
for(const [i,range] of [[0,'A2:H9'],[1,'A2:H12'],[2,'A2:H11'],[3,'A2:F9']]){
  const png=await wb.render({sheetName:names[i],range,scale:1.2,format:'png'});
  await fs.writeFile(`${dir}/preview-${i}.png`,new Uint8Array(await png.arrayBuffer()));
}
await(await SpreadsheetFile.exportXlsx(wb)).save(`${dir}/禾伙人助农公益地图_分表维护版_v1.xlsx`);
console.log(JSON.stringify({projects:projects.length,people:people.length,participation:channels.length,pending:pending.length}));
