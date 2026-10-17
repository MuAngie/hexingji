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
if (stage === 'baseline') {
  const snapshot = {
    main: main.getRange('A1:L17').values,
    pending: pending.getRange('A1:D11').values,
  };
  await fs.writeFile(path.join(work, 'channels-baseline.json'), JSON.stringify(snapshot));
  console.log(JSON.stringify({ projects: snapshot.main.slice(4).map((row, index) => ({ row: index + 5, name: row[0], participation: row[9] })), pending: snapshot.pending }));
  const preview = await workbook.render({ sheetName: '地图项目样例', range: 'J7:L16', scale: 1, format: 'png' });
  await fs.writeFile(path.join(work, 'channels-before.png'), new Uint8Array(await preview.arrayBuffer()));
} else {
  const edits = JSON.parse(await fs.readFile(path.join(work, 'channels_updates.json'), 'utf8'));
  for (const [cell, value] of Object.entries(edits.updates)) main.getRange(cell).values = [[value]];
  for (const cell of ['F10','H10','I10','K10']) {
    const previous = main.getRange(cell).values[0][0];
    main.getRange(cell).values = [[`沙棘项目：${previous}`]];
  }
  for (const [cell, value] of Object.entries(edits.sources)) {
    const previous = main.getRange(cell).values[0][0];
    main.getRange(cell).values = [[`${previous}\n${value}`]];
  }
  for (const [row, height] of Object.entries(edits.row_heights)) main.getRange(`A${row}:L${row}`).format.rowHeight = height;
  for (const [cell, value] of Object.entries(edits.pending_updates)) pending.getRange(cell).values = [[value]];
  edits.pending_new.forEach((values, index) => {
    const row = index + 12;
    const range = pending.getRange(`A${row}:D${row}`);
    range.copyFrom(pending.getRange('A11:D11'), 'all');
    range.values = [values];
    range.format.rowHeight = 96;
  });
  workbook.recalculate();
  console.log(await workbook.inspect({kind:'match', searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?', options:{useRegex:true,maxResults:30},summary:'error scan'}));
  for (const [name, sheetName, range] of [
    ['channels-after', '地图项目样例', 'J7:L16'],
    ['northeast-after', '地图项目样例', 'A10:I10'],
    ['pending-channels-after', '待核验', 'A12:D14'],
  ]) {
    const preview = await workbook.render({sheetName,range,scale:1,format:'png'});
    await fs.writeFile(path.join(work,`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
  }
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(work, 'channels.xlsx'));
  console.log('Exported channels.xlsx');
}
