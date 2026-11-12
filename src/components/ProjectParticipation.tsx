"use client";

import { ArrowUpRight, Check, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";
import { type ParticipationGroup, type ParticipationOption } from "@/data/participation";

export function ParticipationGroups({ groups, detailed = false }: {
  groups: ParticipationGroup[];
  detailed?: boolean;
}) {
  return <div className="participation-groups">{groups.map((group) =>
    <details className="motuo-preview-group" key={group.category}>
      <summary>
        <h4>{group.category}</h4>
        <span className="motuo-preview-group-count">{group.options.length} 项<ChevronRight size={16} aria-hidden="true" /></span>
      </summary>
      {detailed ? group.options.map((option) => <ParticipationCard key={option.id} option={option} />) :
        <ul>{group.options.map((option) => <li key={option.id}>
          <div><strong>{option.name}</strong>{option.platform && option.platform !== "线下" ? <span>{option.platform}</span> : null}</div>
          {option.productsText ? <p>{option.productsText}</p> : null}
          {option.instructions ? <p className="motuo-preview-instructions">{option.instructions}</p> : null}
        </li>)}</ul>}
    </details>
  )}</div>;
}

function ParticipationCard({ option }: { option: ParticipationOption }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const canLink = option.url && !["已结束", "暂时关闭"].includes(option.availabilityStatus ?? "");
  const canSearch = !option.url && (
    ["购买助农", "线上购买"].includes(option.category) || option.platform === "微信小程序"
  );

  return (
    <article className="motuo-option" aria-labelledby={`${option.id}-title`}>
      <div className="motuo-option-heading">
        <h4 id={`${option.id}-title`}>{option.name}</h4>
        {option.platform ? <span className="motuo-platform">{option.platform}</span> : null}
      </div>
      {option.productsText ? <p className="motuo-products">{option.productsText}</p> : null}
      {option.instructions ? <p className="motuo-instructions">{option.instructions}</p> : null}
      {canLink ? (
        <a className="motuo-text-action" href={option.url!} target="_blank" rel="noreferrer">查看相关信息<ArrowUpRight size={14} /></a>
      ) : canSearch ? (
        <button className="motuo-text-action" onClick={async () => {
          try {
            await navigator.clipboard.writeText(option.name);
            setCopyState("copied");
          } catch {
            setCopyState("failed");
          }
        }}>
          {copyState === "copied" ? <Check size={14} /> : <Copy size={14} />}
          {copyState === "copied" ? "已复制搜索词" : "复制搜索词"}
        </button>
      ) : null}
      {copyState !== "idle" ? <p className="motuo-copy-status" role="status">{copyState === "copied" ? `已复制“${option.name}”` : `复制未成功，可手动搜索“${option.name}”`}</p> : null}
    </article>
  );
}
