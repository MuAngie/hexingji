import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const work = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(work, '..', '禾伙人助农公益地图_项目汇总_v3.xlsx');
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const main = workbook.worksheets.getItem('地图项目样例');
const pending = workbook.worksheets.getItem('待核验');
const stage = process.argv[2] ?? 'baseline';
if (stage === 'help') {
  console.log(workbook.help('table.resize', { include: 'index,notes,examples', maxChars: 3000 }).ndjson);
} else if (stage === 'baseline') {
  console.log(workbook.help('table.rows.delete', { include: 'index,notes,examples', maxChars: 3000 }).ndjson);
  console.log((await workbook.inspect({ kind: 'table', range: '地图项目样例!A15:L20', include: 'values', tableMaxRows: 6, tableMaxCols: 12, maxChars: 5000 })).ndjson);
  for (const [sheetName, range, name] of [
    ['地图项目样例', 'G5:L5', 'merge-before-minqin'],
    ['地图项目样例', 'G15:L20', 'merge-before-projects'],
    ['待核验', 'A5:D14', 'merge-before-pending'],
  ]) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
    await fs.writeFile(path.join(work, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
} else {
  const original = main.getRange('A1:L20').values;
  const pendingOriginal = pending.getRange('A1:D14').values;
  const write = (address, value) => { main.getRange(address).values = [[value]]; };
  const append = (address, text) => {
    const col = address.charCodeAt(0) - 65;
    const row = Number(address.slice(1)) - 1;
    write(address, `${original[row][col]}\n${text}`);
  };

  append('G5', '消费助农对象补充：民勤当地人参果种植户及产业合作方。');
  append('I5', '同时了解民勤人参果产业并开展助农直播，将地方农产品推广与治沙行动衔接。');
  append('J5', '购买助农治沙：购买民勤当地农产品（如人参果），支持当地农户与治沙相关团队。优先选择已核实主体的官方渠道；具体店铺及消费助农与治沙的关联待补充。');
  append('K5', '人参果助农直播已有数据库记录；销售量、履约量、农户收益及对治沙的反哺机制仍待核验。');
  append('L5', '人参果合并依据：助农实体库E004、助农事件明细EV002、农产品与渠道P001。\n数据库转引：https://www.iqiyi.com/a_wbm9c2d5c9.html\nhttps://pages.iqiyi.com/p/zbs/news2024031302.html\n合并整理：2026-10-09；原资料口径不变。');
  main.getRange('A5:L5').format.rowHeight = 240;

  append('F18', '前期供应链实践：S2第26、32期草莓采购（E001、EV003、P002）。');
  append('G18', '供应链相关帮助对象：后陡门周边草莓种植户，具体农户姓名待补充。');
  append('H18', '周边果农的草莓销路与加工原料需求，也是前期供应链实践的问题。');
  append('I18', 'S2曾向后陡门周边果农采购草莓，用于草莓酱加工。');
  append('J18', '购买助农：关注爱侬日官方选品与活动信息，核对农产品来源和生产主体后参与购买。');
  append('K18', '草莓采购与加工已有数据库记录；采购规模、农户收益及与爱侬日具体商品的对应关系仍待核验。');
  append('L18', '草莓采购合并依据：助农实体库E001、助农事件明细EV003、农产品与渠道P002。\n数据库转引：https://pages.iqiyi.com/p/zbs/news20240223.html\n合并整理：2026-10-09；原资料口径不变。');

  write('A19', '西双版纳水果助销');
  write('I19', '实地了解果品、灾情与价格，与当地农户或合作方讨论水果助销办法。');
  write('J19', '关注水果助销进展；暂无经核验的项目直购入口，需核对生产主体与销售渠道后补充。');
  write('K19', '助销推进情况待核验：数据库已记录产地调研与助销对策讨论；最终采购、渠道落地、销量和履约结果仍待补充。');

  const projectTable = main.tables.items.find(table => table.name === 'MapProjects');
  projectTable.delete();
  for (const [from, to] of [[18, 15], [19, 16], [20, 17]]) {
    main.getRange(`A${to}:L${to}`).copyFrom(main.getRange(`A${from}:L${from}`), 'all');
    main.getRange(`A${to}:L${to}`).format.rowHeight = from === 18 ? 210 : 138;
  }
  main.getRange('A18:L20').clear({ applyTo: 'all' });
  const resizedTable = main.tables.add('A4:L17', true, 'MapProjects');
  resizedTable.style = 'TableStyleMedium2';
  resizedTable.showHeaders = true;
  resizedTable.showTotals = false;
  resizedTable.showBandedColumns = false;
  resizedTable.showFilterButton = true;
  write('A1', '禾伙人全国助农公益地图｜13条项目与人物事件汇总');
  write('A2', '初次整理：2026-09-11；本次合并整理：2026-10-09。坐标系统：WGS-84，县级/乡镇级坐标仅作地图锚点。人参果助农并入民勤治沙，草莓采购并入爱侬日，删除杨梅采购条目。来源与事实核验时间沿用原资料，未知坐标留空，待观察状态保留。');

  pending.getRange('B2').values = [[`${pendingOriginal[1][1]}；民勤当地农产品（含人参果）的经营主体、购买入口、销售履约及与治沙行动的关联`]];
  pending.getRange('C2').values = [[`${pendingOriginal[1][2]}；同时核对消费助农与治沙的关联`]];
  pending.getRange('D2').values = [[`${pendingOriginal[1][3]}；另回查E004／EV002，核验农产品销售主体与参与入口`]];
  pending.getRange('B8').values = [[`${pendingOriginal[7][1]}；后陡门草莓采购的果农、村庄、数量金额、加工主体与收益`]];
  pending.getRange('C8').values = [[`${pendingOriginal[7][2]}；核对草莓采购与平台具体商品的对应关系`]];
  pending.getRange('D8').values = [[`${pendingOriginal[7][3]}；另回查E001／EV003及S2第26、32期，核对周边果农采购与加工主体`]];
  pending.getRange('A9').values = [['西双版纳水果助销']];
  pending.getRange('C9').values = [['助销对策讨论已记录，实际销售渠道与履约结果仍待核验']];
  for (let from = 8; from <= 14; from++) {
    const to = from - 3;
    pending.getRange(`A${to}:D${to}`).copyFrom(pending.getRange(`A${from}:D${from}`), 'all');
    pending.getRange(`A${to}:D${to}`).format.rowHeight = from === 8 ? 96 : 72;
  }
  pending.getRange('A12:D14').clear({ applyTo: 'all' });
  pending.getRange('A2:D2').format.rowHeight = 96;

  workbook.recalculate();
  console.log((await workbook.inspect({ kind: 'table', range: '地图项目样例!A15:L17', include: 'values', tableMaxRows: 3, tableMaxCols: 12, maxChars: 2500 })).ndjson);
  console.log((await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?', options: { useRegex: true, maxResults: 20 }, maxChars: 1000 })).ndjson);
  for (const [sheetName, range, name] of [
    ['地图项目样例', 'G5:L5', 'merge-after-minqin'],
    ['地图项目样例', 'A15:F17', 'merge-after-names'],
    ['地图项目样例', 'G15:L17', 'merge-after-projects'],
    ['待核验', 'A1:D11', 'merge-after-pending'],
  ]) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
    await fs.writeFile(path.join(work, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(work, 'merged.xlsx'));
  console.log(JSON.stringify({ projectCount: 13, pendingCount: 10, output: path.join(work, 'merged.xlsx') }));
}
