"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Braces, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";

const steps = [
  { title: "Authorize", description: "Teams define scope and invite researchers.", Icon: LockKeyhole },
  { title: "Investigate", description: "Researchers submit a claim and executable proof.", Icon: Braces },
  { title: "Verify", description: "Foundry checks the claim and returns evidence.", Icon: ShieldCheck },
];

export function WorkflowPreview() {
  const [active, setActive] = useState(0);
  const [patched, setPatched] = useState(false);
  const reduceMotion = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const stepNodes = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedAt = useRef<number | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px)");
    function followScroll() {
      if (!desktop.matches || panel.current?.contains(document.activeElement)) return;
      if (selectedAt.current !== null && Math.abs(window.scrollY - selectedAt.current) < 110) return;
      selectedAt.current = null;
      const guide = window.innerHeight * 0.73;
      const bounds = stepNodes.current.map(node => node?.getBoundingClientRect());
      const first = bounds[0];
      const last = bounds[bounds.length - 1];
      if (!first || !last || first.top > guide || last.bottom < 0) return;
      const index = bounds.findLastIndex(bound => bound && bound.top <= guide);
      if (index >= 0) setActive(index);
    }
    window.addEventListener("scroll", followScroll, { passive: true });
    return () => window.removeEventListener("scroll", followScroll);
  }, []);

  function selectStep(index: number) {
    selectedAt.current = window.scrollY;
    setActive(index);
  }

  return (
    <section id="how-it-works" className="workflow-section" aria-labelledby="workflow-title">
      <div className="workflow-heading">
        <h2 id="workflow-title">How it works</h2>
        <span className="text-sm text-muted">ERC-4626 vault · Illustrative example</span>
      </div>
      <div className="workflow-grid workflow-interactive">
        <div className="workflow-steps" role="group" aria-label="Workflow steps">
          {steps.map(({ title, description, Icon }, index) => (
            <button
              key={title}
              type="button"
              ref={node => { stepNodes.current[index] = node; }}
              className="workflow-step focus-ring"
              aria-label={title}
              aria-pressed={active === index}
              aria-controls="workflow-panel"
              onClick={() => selectStep(index)}
              onKeyDown={event => {
                const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
                const direction = keys.indexOf(event.key);
                if (direction < 0) return;
                event.preventDefault();
                const next = (index + (direction < 2 ? 1 : -1) + steps.length) % steps.length;
                stepNodes.current[next]?.focus();
                selectStep(next);
              }}
            >
              <Icon size={18} aria-hidden="true" />
              <span><strong>{title}</strong><small>{description}</small></span>
            </button>
          ))}
        </div>

        <div ref={panel} id="workflow-panel" className="workflow-window" role="region" aria-label="Workflow example">
          <div className="window-bar">
            <span><FileCheck2 size={16} aria-hidden="true" /> Vault audit</span>
            <span className="window-example">Example</span>
          </div>
          <motion.div
            className="window-body"
            key={active}
            initial={active === 0 || reduceMotion ? false : { opacity: 0.7, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            {active === 0 && (
              <>
                <h3>Audit scope</h3>
                <dl className="window-data">
                  <div><dt>Target</dt><dd>ERC-4626 vault</dd></div>
                  <div><dt>Access</dt><dd>Invited researchers</dd></div>
                  <div><dt>Environment</dt><dd>Local fixtures</dd></div>
                </dl>
                <p>Program invitations and permissions are planned.</p>
              </>
            )}
            {active === 1 && (
              <>
                <h3>Share-inflation claim</h3>
                <div className="claim-flow">
                  <span>Researcher’s AI agent</span>
                  <svg aria-hidden="true" width="32" height="16" viewBox="0 0 32 16"><path d="M1 8h28m-6-6 6 6-6 6" pathLength="1" /></svg>
                  <span>Executable PoC</span>
                </div>
                <p>A deposit and donation can leave the victim with zero shares.</p>
              </>
            )}
            {active === 2 && (
              <>
                <h3>Fixture comparison</h3>
                <div className="fixture-switch" role="group" aria-label="Example fixture">
                  <button className="focus-ring" type="button" aria-pressed={!patched} onClick={() => setPatched(false)}>Vulnerable</button>
                  <button className="focus-ring" type="button" aria-pressed={patched} onClick={() => setPatched(true)}>Patched</button>
                </div>
                <div className="example-verdict" aria-live="polite">
                  <strong>{patched ? "Not reproduced" : "Reproduced"}</strong>
                  <span>{patched ? "The same attack is unprofitable." : "The attacker gains 100 assets and the victim gets zero shares."}</span>
                </div>
                <p>Illustrative outcome. Live runs return private evidence.</p>
              </>
            )}
          </motion.div>
          <div className="window-footer">
            <Link className="focus-ring" href="/verify">Run real PoC <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
      <noscript><style>{".workflow-interactive { display: none !important } .workflow-fallback { display: block !important }"}</style></noscript>
      <div className="workflow-fallback hidden">
        <ol aria-label="Workflow summary" className="grid gap-3 py-5">
          {steps.map(step => <li key={step.title}><strong>{step.title}</strong> · {step.description}</li>)}
        </ol>
        <a className="site-action focus-ring" href="/verify">Run real PoC</a>
      </div>
    </section>
  );
}
