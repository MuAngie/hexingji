from pathlib import Path
from zipfile import ZipFile
import copy, json, re, xml.etree.ElementTree as ET
from io import BytesIO
import openpyxl

root = Path(__file__).parent
target = root.parent / '禾伙人助农公益地图_项目汇总_v3.xlsx'
source = root / 'original.xlsx.before-motuo'
authored = root / 'motuo-authored.xlsx'
result = root / 'motuo-preserved.xlsx'
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ET.register_namespace('', ns['m'])
updates = json.loads((root / 'motuo_updates.json').read_text(encoding='utf-8'))
sheet_path = 'xl/worksheets/sheet1.xml'
with ZipFile(source) as original, ZipFile(authored) as edited:
    xml = original.read(sheet_path).decode('utf-8')
    old_tree = ET.fromstring(xml)
    edit_tree = ET.fromstring(edited.read(sheet_path))
    strings = ET.fromstring(edited.read('xl/sharedStrings.xml')) if 'xl/sharedStrings.xml' in edited.namelist() else None
    for address in updates:
        old_cell = old_tree.find(f'.//m:c[@r="{address}"]', ns)
        cell = copy.deepcopy(edit_tree.find(f'.//m:c[@r="{address}"]', ns))
        if cell.get('t') == 's':
            index = int(cell.find('m:v', ns).text)
            cell.remove(cell.find('m:v', ns))
            cell.set('t', 'inlineStr')
            inline = ET.SubElement(cell, f"{{{ns['m']}}}is")
            for child in strings[index]:
                inline.append(copy.deepcopy(child))
        cell.set('s', old_cell.get('s', '0'))
        pattern = rf'<c\b(?=[^>]*\br="{address}")[^>]*?(?:/>|>.*?</c>)'
        xml, count = re.subn(pattern, lambda _: ET.tostring(cell, encoding='unicode'), xml, count=1, flags=re.S)
        assert count == 1, address
    row_pattern = r'<row\b(?=[^>]*\br="13")[^>]*>'
    def resize(match):
        tag = re.sub(r'\sht="[^"]*"', ' ht="160"', match[0])
        return tag if 'customHeight=' in tag else tag[:-1] + ' customHeight="1">'
    xml, count = re.subn(row_pattern, resize, xml, count=1)
    assert count == 1
    with ZipFile(result, 'w') as output:
        for item in original.infolist():
            output.writestr(item, xml.encode('utf-8') if item.filename == sheet_path else original.read(item.filename))
old_wb = openpyxl.load_workbook(BytesIO(source.read_bytes()))
new_wb = openpyxl.load_workbook(result)
diff = []
for old_sheet, new_sheet in zip(old_wb, new_wb):
    for row in old_sheet:
        for cell in row:
            if cell.value != new_sheet[cell.coordinate].value:
                diff.append((old_sheet.title, cell.coordinate))
assert set(diff) == {('地图项目样例', address) for address in updates}, diff
for address, value in updates.items():
    assert new_wb['地图项目样例'][address].value == value
with ZipFile(source) as old_zip, ZipFile(result) as new_zip:
    changed_parts = [name for name in old_zip.namelist() if old_zip.read(name) != new_zip.read(name)]
    assert changed_parts == [sheet_path], changed_parts
assert target.read_bytes() == source.read_bytes(), 'File was updated during editing; do not overwrite.'
target.write_bytes(result.read_bytes())
print('Saved: 9 blank cells filled; only row 13 changed; all other workbook parts preserved.')
