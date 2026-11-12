"""Read the four maintenance sheets and export website content. Never saves the workbook."""
import datetime
import json
from pathlib import Path
from urllib.parse import urlsplit

import openpyxl
from openpyxl.utils.cell import range_boundaries
from openpyxl.utils.datetime import from_excel

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "outputs/heji-maintenance-20261031/禾伙人助农公益地图_分表维护版_v1.xlsx"
TARGET = ROOT / "src/data/heji-content.json"
FIELDS = {
    "项目汇总": {
        "项目编号": "id", "项目名称": "name", "项目地点": "region",
        "节目节点": "program", "问题": "problem", "十个勤天与节目组做了什么": "action",
        "当地有什么": "localFeatures", "金句文案": "quote", "当前状态／后续结果": "result",
        "纬度": "latitude", "经度": "longitude", "坐标精度": "coordinateAccuracyText",
        "来源及原核验口径": "sourceNotes",
    },
    "项目人物": {
        "关系编号": "id", "项目编号": "projectId", "姓名／称呼／对象": "name",
        "官方公开账号": "publicAccount", "对象类型": "objectType", "身份及与项目的关系": "role",
        "记录状态": "recordStatus", "最后核验日期": "lastVerifiedAt", "待补充": "pendingNotes",
    },
    "参与方式": {
        "参与编号": "id", "项目编号": "projectId", "参与类别": "category",
        "平台／场景": "platform", "店铺／活动／入口": "name", "相关产品／内容": "productsText",
        "参与步骤及限制": "instructions", "链接": "url", "最后编辑日期": "lastEditedAt",
        "有效状态": "availabilityStatus", "记录状态": "recordStatus", "待补充": "pendingNotes",
    },
    "待核验": {
        "待办编号": "id", "关联项目编号": "projectIds", "事项": "title",
        "还缺什么": "missingInfo", "为什么重要": "reason", "下一步": "nextStep",
        "处理状态": "status", "完成日期": "completedAt",
    },
}

workbook = openpyxl.load_workbook(SOURCE, data_only=True)
collections_by_sheet, warnings = {}, []
for sheet_name, fields in FIELDS.items():
    sheet = workbook[sheet_name]
    headers = [cell.value for cell in sheet[6]]
    missing = fields.keys() - set(headers)
    if missing:
        raise ValueError(f"{sheet_name}: 缺少字段 {sorted(missing)}")
    table_end = max(range_boundaries(table.ref)[3] for table in sheet.tables.values())
    records = []
    for row_number, values in enumerate(sheet.iter_rows(min_row=7, values_only=True), 7):
        if not any(value is not None and str(value).strip() for value in values):
            continue
        if row_number > table_end:
            raise ValueError(f"{sheet_name}!{row_number}: 请先扩展 Excel 表格范围")
        record = {}
        for label, key in fields.items():
            value = values[headers.index(label)]
            if isinstance(value, str):
                value = value.strip() or None
            if key in ("lastVerifiedAt", "lastEditedAt", "completedAt") and value is not None:
                if isinstance(value, (float, int)):
                    value = from_excel(value, workbook.epoch)
                value = value.date().isoformat() if isinstance(value, datetime.datetime) else str(value)
                datetime.date.fromisoformat(value)
            record[key] = value
        if not record["id"]:
            raise ValueError(f"{sheet_name}!{row_number}: 编号为空")
        if "name" in record and not record["name"]:
            raise ValueError(f"{sheet_name}!{row_number}: 名称为空")
        records.append(record)
    if len({record["id"] for record in records}) != len(records):
        raise ValueError(f"{sheet_name}: 编号重复，请核对")
    collections_by_sheet[sheet_name] = records

projects = collections_by_sheet["项目汇总"]
project_ids = {record["id"] for record in projects}
for sheet_name in ("项目人物", "参与方式"):
    for record in collections_by_sheet[sheet_name]:
        if record["projectId"] not in project_ids:
            raise ValueError(f"{record['id']}: 关联项目不存在")
        if record["recordStatus"] not in (None, "在册", "已归档"):
            raise ValueError(f"{record['id']}: 记录状态无效")
for option in collections_by_sheet["参与方式"]:
    if not option["category"]:
        raise ValueError(f"{option['id']}: 参与类别为空")
    if option["availabilityStatus"] not in (None, "待确认", "可参与", "季节性开放", "暂时关闭", "已结束"):
        raise ValueError(f"{option['id']}: 有效状态无效")
    if option["url"]:
        url = urlsplit(option["url"])
        if url.scheme not in ("http", "https") or not url.netloc:
            raise ValueError(f"{option['id']}: 链接格式无效")
for project in projects:
    latitude, longitude = project.pop("latitude"), project.pop("longitude")
    project["coordinateNotes"] = None
    try:
        latitude = float(latitude) if latitude is not None else None
        longitude = float(longitude) if longitude is not None else None
    except (ValueError, TypeError):
        project["coordinateNotes"] = f"纬度：{latitude or ''}；经度：{longitude or ''}"
        warnings.append(f"{project['id']}: 坐标含备注，保留备注并使用现有地图示意位置")
        latitude, longitude = None, None
    if latitude is not None and not -90 <= latitude <= 90:
        raise ValueError(f"{project['id']}: 纬度超出范围")
    if longitude is not None and not -180 <= longitude <= 180:
        raise ValueError(f"{project['id']}: 经度超出范围")
    project["coordinates"] = ({"latitude": latitude, "longitude": longitude}
                              if latitude is not None and longitude is not None else None)
for task in collections_by_sheet["待核验"]:
    task["projectIds"] = list(dict.fromkeys(value.strip() for value in (task["projectIds"] or "").split("/") if value.strip()))
    if set(task["projectIds"]) - project_ids:
        raise ValueError(f"{task['id']}: 关联项目不存在")

data = {
    "schemaVersion": "1.0", "sourceWorkbook": SOURCE.name,
    "exportedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "projects": projects, "projectPeople": collections_by_sheet["项目人物"],
    "participationOptions": collections_by_sheet["参与方式"],
    "verificationTasks": collections_by_sheet["待核验"],
}
TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"已导出 {len(projects)} 个项目，{len(data['projectPeople'])} 条人物记录，{len(data['participationOptions'])} 条参与方式")
for warning in warnings:
    print(warning)
