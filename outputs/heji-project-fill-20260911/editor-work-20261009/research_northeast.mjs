import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const work = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(work,'..','禾伙人助农公益地图_项目汇总_v3.xlsx');
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const main = workbook.worksheets.getItem('地图项目样例');
const pending = workbook.worksheets.getItem('待核验');
const stage = process.argv[2] ?? 'baseline';
if (stage === 'baseline') {
  const preview = await workbook.render({sheetName:'地图项目样例',range:'G10:L10',scale:1,format:'png'});
  await fs.writeFile(path.join(work,'northeast-research-before.png'),new Uint8Array(await preview.arrayBuffer()));
  console.log('Rendered current northeast record.');
} else if (stage === 'font-help') {
  console.log(JSON.stringify(workbook.help('range.format.font')));
} else {
  const edits = JSON.parse(await fs.readFile(path.join(work,'northeast_research_updates.json'),'utf8'));
  for (const [cell,value] of Object.entries(edits.main)) main.getRange(cell).values = [[value]];
  for (const [cell,addition] of Object.entries(edits.append)) {
    main.getRange(cell).values = [[`${main.getRange(cell).values[0][0]}\n${addition}`]];
  }
  main.getRange('A10:L10').format.rowHeight = 330;
  for (const [cell,value] of Object.entries(edits.pending)) pending.getRange(cell).values = [[value]];
  edits.new_pending.forEach((values,index)=>{
    const range = pending.getRange(`A${index+15}:D${index+15}`);
    range.copyFrom(pending.getRange('A12:D12'),'all');
    range.values = [values];
    range.format.rowHeight = 150;
  });
  workbook.recalculate();
  console.log((await workbook.inspect({kind:'table',range:'地图项目样例!A10:L10',include:'values',tableMaxRows:1,tableMaxCols:12,maxChars:1500})).ndjson);
  console.log((await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20}})).ndjson);
  for (const [name,sheetName,range] of [
    ['northeast-research-after','地图项目样例','G10:L10'],
    ['northeast-research-pending','待核验','A15:D17'],
  ]) {
    const preview = await workbook.render({sheetName,range,scale:1,format:'png'});
    await fs.writeFile(path.join(work,`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
  }
  await (await SpreadsheetFile.exportXlsx(workbook)).save(path.join(work,'northeast-research.xlsx'));
  console.log('Exported northeast-research.xlsx');
}
