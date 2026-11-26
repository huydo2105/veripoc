"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { FAQ_ITEMS } from "@/lib/faq-data";

const featuredQuestions = FAQ_ITEMS.filter(item => item.featured);

export function HomeFaq() {
  const [open, setOpen] = useState<Set<string>>(() => new Set([featuredQuestions[0]?.id ?? "what-is-auditor"]));

  function toggle(id: string) {
    setOpen(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return <section id="faq" className="faq-section" aria-labelledby="faq-title">
    <div className="site-shell faq-inner">
      <div className="faq-heading">
        <h2 id="faq-title">Frequently asked questions</h2>
        <Link href="/faq" className="faq-all focus-ring">View all FAQs</Link>
      </div>
      <div className="faq-list">{featuredQuestions.map((item, index) => {
        const expanded = open.has(item.id);
        return <div className="faq-item" key={item.id}>
          <h3>
            <button type="button" className="faq-question focus-ring" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => toggle(item.id)}>
              <span>{item.id === "what-is-auditor" ? <>What is <BrandMark size={23} /> Auditor?</> : item.question}</span>
              <span className="faq-symbol" aria-hidden="true">{expanded ? "×" : "+"}</span>
            </button>
          </h3>
          <div id={`faq-answer-${index}`} className="faq-answer" hidden={!expanded}>
            <div className="faq-flow">
              {item.steps && <ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol>}
              {item.paragraphs.map(text => <p key={text}>{text}</p>)}
              {item.link && <p className="faq-badge-answer"><a href={item.link.href} target={item.link.external ? "_blank" : undefined} rel={item.link.external ? "noopener noreferrer" : undefined}>{item.link.label} <ArrowUpRight size={14} className="inline" aria-hidden="true" /></a></p>}
            </div>
          </div>
        </div>;
      })}</div>
    </div>
  </section>;
}
