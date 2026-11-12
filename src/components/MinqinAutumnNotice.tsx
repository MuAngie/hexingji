import { minqinAutumnNotice as notice } from "@/data/minqin-autumn-2026";
import { ChevronRight } from "lucide-react";

export function MinqinAutumnDetails() {
  return <div className="minqin-notice-details">
    <details>
      <summary>报名与行前须知<ChevronRight size={14} aria-hidden="true" /></summary>
      <ul>{notice.preparation.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>
    <details>
      <summary>交通与官方咨询<ChevronRight size={14} aria-hidden="true" /></summary>
      <ul>{notice.routes.map((route) => <li key={route}>{route}</li>)}</ul>
      <p>班次及参考票价见活动原图，出行前请查询实际信息。</p>
      <p>电话／微信：{notice.contacts.map((phone, index) => <span key={phone}>{index ? "、" : ""}<a href={`tel:${phone}`}>{phone}</a></span>)}</p>
      <p>微信公众号：{notice.publisher}<br />抖音／小红书：小仲沙漠变绿洲</p>
    </details>
  </div>;
}

export function MinqinAutumnSources() {
  return <div className="minqin-notice-sources">
    <h4>2026年秋季造林活动须知</h4>
    <p>{notice.publisher}</p>
    <div className="minqin-notice-posters">
      {notice.posters.map((poster) => <a key={poster.src} href={poster.src} target="_blank" rel="noreferrer" aria-label={`${poster.label}，打开原图`}>
        <img src={poster.src} alt={`民勤2026年秋季造林公告：${poster.label}`} loading="lazy" />
        <span>{poster.label}</span>
      </a>)}
    </div>
  </div>;
}
