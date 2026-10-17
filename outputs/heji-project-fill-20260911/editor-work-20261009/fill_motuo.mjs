import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const target = 'D:/L/Codex Space/same world/outputs/heji-project-fill-20260911/禾伙人助农公益地图_项目汇总_v3.xlsx';
const dir = 'D:/L/Codex Space/same world/outputs/heji-project-fill-20260911/editor-work-20261009';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const sheet = workbook.worksheets.getItem('地图项目样例');
const stage = process.argv[2] ?? 'before';
if (stage === 'edit') {
  await fs.copyFile(target, `${dir}/original.xlsx.before-motuo`);
  const updates = JSON.parse(await fs.readFile(`${dir}/motuo_updates.json`, 'utf8'));
  for (const [cell, value] of Object.entries(updates)) {
    if (sheet.getRange(cell).values[0][0] != null && sheet.getRange(cell).values[0][0] !== '') throw new Error(`Refusing to overwrite ${cell}`);
    sheet.getRange(cell).values = [[value]];
  }
  sheet.getRange('A13:M13').format.rowHeight = 160;
  workbook.recalculate();
  console.log((await workbook.inspect({kind:'table',range:'地图项目样例!I13:M13',include:'values,formulas',tableMaxRows:1,tableMaxCols:5,maxChars:2200})).ndjson);
  console.log((await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#SPILL!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
}
const preview = await workbook.render({sheetName:'地图项目样例',range:'A13:M13',scale:1.5,format:'png'});
await fs.writeFile(`${dir}/motuo-${stage}.png`,new Uint8Array(await preview.arrayBuffer()));
if (stage === 'edit') await (await SpreadsheetFile.exportXlsx(workbook)).save(`${dir}/motuo-authored.xlsx`);
console.log(`Finished ${stage}`);
