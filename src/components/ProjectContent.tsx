"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ChevronRight, MapPin, Wheat, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getProjectView, type HejiLocation } from "@/data/projects";
import { ParticipationGroups } from "./ProjectParticipation";
import { ChibiAvatar } from "./ChibiAvatar";
import { minqinAutumnNotice } from "@/data/minqin-autumn-2026";
import { MinqinAutumnSources } from "./MinqinAutumnNotice";
import { ProjectVisitCounter } from "./ProjectVisitCounter";

export function ProjectStoryCard({ location, onShowDetails, onClose }: {
  location: HejiLocation;
  onShowDetails: () => void;
  onClose: () => void;
}) {
  const { project, groups, categories, programText, regionText } = getProjectView(location.id);

  return (
    <motion.section
      aria-label="项目概览"
      className="story-card-overlay glass-surface motuo-preview"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="story-card-header">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <Wheat size={19} className="mt-1 shrink-0 text-[#d5a333]" />
            <h2 className="whitespace-pre-line">{project.name.replace("｜", "｜\n")}</h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">{categories.map((category) => <span className="type-pill" key={category}>{category}</span>)}</div>
        </div>
        <button className="project-detail-close" onClick={onClose} aria-label="关闭项目概览"><X size={18} /></button>
      </div>
      <div className="story-card-scroll">
        {regionText ? <p className="motuo-place"><MapPin size={14} /><span className="motuo-region">{regionText}</span></p> : null}
        <section className="motuo-preview-section">
          <h3>项目概况</h3>
          {programText ? <p className="motuo-muted">{programText}</p> : null}
          {project.problem ? <p>{project.problem}</p> : null}
        </section>
        {groups.length ? <section className="motuo-preview-section">
          <h3>参与方式</h3>
          <ParticipationGroups groups={groups} />
        </section> : null}
      </div>
      <div className="story-card-footer">
        <button className="story-more-button" onClick={onShowDetails}>查看完整资料<ChevronRight size={16} /></button>
        <ProjectVisitCounter key={project.id} projectId={project.id} />
      </div>
    </motion.section>
  );
}

export function ProjectDetail({ location, onClose }: { location: HejiLocation; onClose: () => void }) {
  const { project, people, groups, counts, sourceLinks, quoteLines, quoteEmphasisIndex, categories, programText, regionText } = getProjectView(location.id);
  const dialogRef = useRef<HTMLElement>(null);
  const jumpingRef = useRef(false);
  const sections = [
    ...(quoteLines.length ? [["copy", "文案"]] : []),
    ["overview", "项目概况"],
    ...(groups.length ? [["participation", "参与方式"]] : []),
    ...(project.action ? [["action", "十个勤天的行动"]] : []),
    ...(people.length ? [["people", "相关人物"]] : [])
  ];
  const [activeSection, setActiveSection] = useState(sections[0][0]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], summary'))
        .filter((element) => element.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  function jumpTo(id: string) {
    jumpingRef.current = true;
    const section = dialogRef.current?.querySelector<HTMLElement>(`#motuo-${id}`);
    section?.scrollIntoView({ behavior: "instant", block: "start" });
    section?.focus({ preventScroll: true });
    setActiveSection(id);
    requestAnimationFrame(() => { jumpingRef.current = false; });
  }

  return (
    <motion.div className="project-detail-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="motuo-title"
        className="motuo-sheet"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="motuo-heading">
          <div className="motuo-heading-top"><span className="motuo-eyebrow">项目档案 / {project.id}</span><button className="project-detail-close" onClick={onClose} aria-label="关闭完整资料"><X size={20} /></button></div>
          <h2 id="motuo-title" className="whitespace-pre-line">{project.name.replace("｜", "｜\n")}</h2>
          {regionText ? <p className="motuo-place"><MapPin size={15} /><span className="motuo-region">{regionText}</span></p> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">{categories.map((category) => <span className="motuo-tag" key={category}>{category}</span>)}</div>
        </header>
        <nav className="motuo-nav" aria-label="项目内容导航">
          {sections.map(([id, label]) => <button key={id} aria-current={activeSection === id ? "location" : undefined} onClick={() => jumpTo(id)}>{label}</button>)}
        </nav>
        <div className="motuo-scroll" onScroll={(event) => {
          if (jumpingRef.current) return;
          const container = event.currentTarget;
          if (container.scrollHeight - container.scrollTop - container.clientHeight < 2) {
            setActiveSection(sections.at(-1)![0]);
            return;
          }
          const top = container.getBoundingClientRect().top;
          const current = sections.filter(([id]) => {
            const element = container.querySelector(`#motuo-${id}`);
            return element && element.getBoundingClientRect().top <= top + 64;
          }).at(-1)?.[0];
          if (current) setActiveSection(current);
        }}>
          {quoteLines.length ? <section id="motuo-copy" className="motuo-section" aria-label="文案" tabIndex={-1}>
            <div className="motuo-copy">
              {quoteLines.map((line, index) => <p key={index} className={index === quoteEmphasisIndex ? "motuo-copy-emphasis" : index === quoteLines.length - 1 ? "motuo-copy-closing" : undefined}>
                {line.split(/(?<=，)/).map((part, partIndex) => <span key={partIndex}>{part}</span>)}
              </p>)}
            </div>
          </section> : null}
          <section id="motuo-overview" className="motuo-section" tabIndex={-1}>
            <h3>项目概况</h3>
            {programText ? <div className="motuo-program"><span>节目节点</span><p>{programText}</p></div> : null}
            {project.problem ? <><h4>面对的问题</h4><p>{project.problem}</p></> : null}
          </section>
          {groups.length ? <section id="motuo-participation" className="motuo-section" tabIndex={-1}>
            <div className="motuo-section-heading"><h3>参与方式</h3><span>{counts.participationRecords} 条线索</span></div>
            <ParticipationGroups groups={groups} detailed />
          </section> : null}
          {project.action ? <section id="motuo-action" className="motuo-section" tabIndex={-1}>
            <h3>十个勤天的行动</h3>
            {project.action ? <p>{project.action}</p> : null}
          </section> : null}
          {people.length ? <section id="motuo-people" className="motuo-section" tabIndex={-1}>
            <div className="motuo-section-heading"><h3>相关人物</h3><span>{counts.objects} 条关系</span></div>
            <ul className="motuo-people">
              {people.map((person) => <li className="motuo-person-card" key={person.id}>
                <div className="motuo-person-header">
                  <ChibiAvatar seed={person.id} group={["群体", "团队", "组织"].includes(person.objectType ?? "")} />
                  <span className="motuo-person-type">{person.objectType}</span>
                </div>
                <h4>{person.name}</h4>
                {person.role ? <p className="motuo-person-role">{person.role}</p> : null}
                {person.publicAccount ? <p className="motuo-person-account"><span>公开账号</span>{person.publicAccount}</p> : null}
              </li>)}
            </ul>
          </section> : null}
          {project.sourceNotes || sourceLinks.length ? <footer>
            <details className="motuo-original-source">
              <summary>资料来源</summary>
              {project.id === minqinAutumnNotice.projectId ? <MinqinAutumnSources /> : null}
              <div className="motuo-source-links">{sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={14} /></a>)}</div>
              <p>{project.sourceNotes}</p>
            </details>
          </footer> : null}
        </div>
      </motion.aside>
    </motion.div>
  );
}
