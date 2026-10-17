from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET

# Restore original native styles and sheet views after Artifact Tool authoring.
work = Path(__file__).parent
source = work / 'original.xlsx.before-northeast-research'
candidate = work / 'northeast-research.xlsx'
fixed = work / 'northeast-research-native.xlsx'
ns = {'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ET.register_namespace('',ns['s'])
ET.register_namespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
with ZipFile(source) as original, ZipFile(candidate) as edited, ZipFile(fixed,'w',ZIP_DEFLATED) as result:
    for item in edited.infolist():
        data = edited.read(item.filename)
        if item.filename == 'xl/styles.xml':
            data = original.read(item.filename)
        elif item.filename in ['xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml']:
            old = ET.fromstring(original.read(item.filename))
            new = ET.fromstring(data)
            originals = {cell.attrib['r']:cell for cell in old.findall('.//s:sheetData/s:row/s:c',ns)}
            for cell in new.findall('.//s:sheetData/s:row/s:c',ns):
                address = cell.attrib['r']
                template = originals.get(address)
                if item.filename.endswith('sheet2.xml') and address[0] in 'ABCD' and address[1:] in ['15','16','17']:
                    template = originals.get(address[0]+'12')
                if template is not None:
                    if 's' in template.attrib:
                        cell.set('s',template.attrib['s'])
                    else:
                        cell.attrib.pop('s',None)
            old_view = old.find('s:sheetViews',ns)
            new_view = new.find('s:sheetViews',ns)
            if old_view is not None and new_view is not None:
                index = list(new).index(new_view)
                new.remove(new_view)
                new.insert(index,deepcopy(old_view))
            data = ET.tostring(new,encoding='utf-8',xml_declaration=True)
        result.writestr(item,data)
fixed.replace(candidate)
print('Restored original styles and sheet views; authored cell values retained.')
