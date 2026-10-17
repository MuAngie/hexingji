import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const work = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(work, '..', '禾伙人助农公益地图_项目汇总_v3.xlsx');
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const stage = process.argv[2] ?? 'baseline';

if (stage === 'baseline') {
  console.log((await workbook.inspect({ kind: 'sheet', include: 'id,name', maxChars: 2000 })).ndjson);
  for (const [sheetName, range, name] of [
    ['地图项目样例', 'A4:L7', 'before-projects'],
    ['待核验', 'A1:D4', 'before-pending'],
  ]) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
    await fs.writeFile(path.join(work, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
} else {
  const additions = JSON.parse(await fs.readFile(path.join(work, 'additions.json'), 'utf8'));
  const sourceRows = JSON.parse(await fs.readFile(path.join(work, 'source_rows.json'), 'utf8'));
  const baseline = JSON.parse(await fs.readFile(path.join(work, 'baseline.json'), 'utf8'));
  const main = workbook.worksheets.getItem('地图项目样例');
  const pending = workbook.worksheets.getItem('待核验');
  const sourceName = '种地吧全四季_助农关系数据库_升级版.xlsx';
  const sourceSheets = { entities: '助农实体库', events: '助农事件明细', products: '农产品与渠道' };

  function sourceNotes(ids, includeLinks = true) {
    const refs = [];
    const urls = [];
    for (const [kind, sheetName] of Object.entries(sourceSheets)) {
      for (const id of ids[kind]) {
        const record = sourceRows[sheetName].find(row => row[0] === id);
        if (!record) throw new Error(`Missing source: ${sheetName} ${id}`);
        refs.push(`${sheetName}:${id}`);
        urls.push(...record.filter(value => typeof value === 'string' && value.startsWith('https://')));
      }
    }
    const uniqueUrls = [...new Set(urls)];
    if (ids.entities.includes('E013')) {
      uniqueUrls.sort((a, b) => Number(b.includes('news20250715')) - Number(a.includes('news20250715')));
    }
    return [
      `提取自：${sourceName}`,
      refs.join('；'),
      ...(includeLinks ? ['原始来源（数据库转引，未重新访问）：', ...uniqueUrls.slice(0, 2)] : []),
      '资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。',
    ].join('\n');
  }

  const newRows = additions.rows.map((row, index) => {
    if (row.length !== 12) throw new Error('Expected 12 columns');
    const result = [...row];
    result[11] = sourceNotes(additions.source_ids[index]);
    return result;
  });
  const projectTable = main.tables.items.find(table => table.name === 'MapProjects');
  if (!projectTable) throw new Error('Existing MapProjects table missing');
  projectTable.rows.add(null, newRows);
  for (let row = 15; row <= 20; row++) {
    main.getRange(`A${row}:L${row}`).copyFrom(main.getRange('A14:L14'), 'all');
    main.getRange(`A${row}:L${row}`).format.rowHeight = 138;
  }
  main.getRange('A15:L20').values = newRows;
  // The new source column has enough room for traceable IDs and two inherited links.
  main.getRange('A18:L18').format.rowHeight = 162;
  main.getRange('A1').values = [['禾伙人全国助农公益地图｜16条项目与人物事件汇总']];
  main.getRange('A2').values = [['初次整理：2026-09-11；本次补充：2026-10-09。坐标系统：WGS-84，县级/乡镇级坐标仅作地图锚点。新增6条来自关系数据库（口径截至2026-09-03），未重新核验外部事实或当前参与入口；未知坐标留空，调研及对策讨论标为待观察。原10项目的事实核验时间沿用原记录。']];

  const allowedCells = ['A1', 'A2'];
  for (const [address, text] of Object.entries(additions.append_cells)) {
    const original = baseline['地图项目样例'].cells[address].value;
    main.getRange(address).values = [[`${original}\n${text}`]];
    allowedCells.push(address);
  }
  for (const [address, ids] of Object.entries(additions.existing_sources)) {
    const original = baseline['地图项目样例'].cells[address].value;
    main.getRange(address).values = [[`${original}\n补充依据：${sourceNotes(ids, false)}`]];
    allowedCells.push(address);
  }
  main.getRange('A5:L5').format.rowHeight = 162;
  for (let row = 5; row <= 14; row++) {
    pending.getRange(`A${row}:D${row}`).copyFrom(pending.getRange('A4:D4'), 'all');
    pending.getRange(`A${row}:D${row}`).format.rowHeight = 72;
  }
  pending.getRange('A5:D14').values = additions.pending;

  workbook.recalculate();
  console.log((await workbook.inspect({ kind: 'table', range: '地图项目样例!A15:F20', include: 'values', tableMaxRows: 6, tableMaxCols: 6, maxChars: 3000 })).ndjson);
  const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!', options: { useRegex: true, maxResults: 30 }, maxChars: 2000 });
  console.log(errors.ndjson);
  const previews = [
    ['地图项目样例', 'A1:L2', 'after-title'],
    ['地图项目样例', 'A15:F20', 'after-new-places'],
    ['地图项目样例', 'G15:L20', 'after-new-stories'],
    ['地图项目样例', 'G5:L11', 'after-existing-stories'],
    ['待核验', 'A5:D14', 'after-pending'],
  ];
  for (const [sheetName, range, name] of previews) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
    await fs.writeFile(path.join(work, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(work, 'edited.xlsx'));
  await fs.writeFile(path.join(work, 'allowed_changes.json'), JSON.stringify({ cells: allowedCells, newMainRows: [15, 20], newPendingRows: [5, 14], changedRowHeights: [5] }));
  console.log(JSON.stringify({ newProjects: newRows.length, newPendingItems: additions.pending.length, changedExistingCells: allowedCells.length, candidate: path.join(work, 'edited.xlsx') }));
}
