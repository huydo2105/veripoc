#!/usr/bin/env python3
"""Idempotently sync VeriPoC issues into native GitHub Milestones and a Projects v2 board.

Prerequisites: gh (authenticated with repo and project scopes), Python 3.
Usage: python3 scripts/sync-github-planning.py [--dry-run | --milestones-only | --projects-only]
Do not use this script to merge PRs or close issues; it never changes issue state.
"""
import argparse
import json
import subprocess
import sys

REPO = "huydo2105/veripoc"
OWNER = "huydo2105"
PROJECT_TITLE = "VeriPoC — Two-Sided Agentic Security MVP"

# Keep each engineering issue in exactly one native milestone. Tracking issues
# #24–27 are excluded to avoid counting them twice in native progress bars.
MILESTONES = [
    dict(title="M1 — Foundation & Identity", old="M1 — Identity & Analysis Foundation",
         due="2026-11-15T22:59:00Z", tracker=24,
         description="Complete: identity, Foundry baseline, fixtures and optional Slither adapter.",
         issues=[20,1,2,3,4]),
    dict(title="M2 — Two-Sided MVP & Checkpoint", old="M2 — Verified PoC & Checkpoint 1",
         due="2026-11-22T22:59:00Z", tracker=25,
         description="PoC console, two-role homepage, scoped demo audit program, agent auth, checkpoint.",
         issues=[5,6,7,8,34,35,12,9]),
    dict(title="M3 — BYO Agents, Concordium & Triage", old="M3 — Concordium & Agent Integrations",
         due="2026-11-29T22:59:00Z", tracker=26,
         description="Core: Concordium anchor, researcher-agent MCP/REST, team inbox/retest. Optional: escrow, fuzzing and LLM.",
         issues=[10,13,36,11,14,15]),
    dict(title="M4 — Live Demo & Final Submission", old="M4 — Demo & Final Submission",
         due="2026-12-09T23:59:00Z", tracker=27,
         description="Core: final integrated two-sided demo and submission. Optional: symbolic, x402, ZKP.",
         issues=[19,16,17,18]),
]

# Estimated planning windows. Stretch items have no dates, so they do not clutter
# the Roadmap view or imply commitments.
WINDOWS = {
    20:("2026-11-09","2026-11-10"), 1:("2026-11-10","2026-11-10"),
    2:("2026-11-10","2026-11-10"), 3:("2026-11-10","2026-11-10"),
    4:("2026-11-10","2026-11-10"),
    5:("2026-11-10","2026-11-10"), 6:("2026-11-10","2026-11-10"),
    7:("2026-11-10","2026-11-10"), 8:("2026-11-10","2026-11-10"),
    34:("2026-11-11","2026-11-14"), 35:("2026-11-14","2026-11-19"),
    12:("2026-11-19","2026-11-22"), 9:("2026-11-20","2026-11-22"),
    10:("2026-11-23","2026-11-27"), 13:("2026-11-24","2026-11-29"),
    36:("2026-11-27","2026-11-29"),
    19:("2026-11-30","2026-12-09"),
}

OPTIONAL = {11,14,15,16,17,18}
P1 = {36}
TEAM = {34,35,36}
RESEARCHER = {13,34,35}

parser = argparse.ArgumentParser()
parser.add_argument("--dry-run", action="store_true")
parser.add_argument("--milestones-only", action="store_true")
parser.add_argument("--projects-only", action="store_true")
args = parser.parse_args()
if args.milestones_only and args.projects_only:
    parser.error("Choose at most one of --milestones-only / --projects-only.")

def gh(*parts, input_obj=None):
    cmd = ["gh", *map(str, parts)]
    kwargs = {"capture_output":True, "text":True, "check":False}
    if input_obj is not None:
        kwargs["input"] = json.dumps(input_obj)
    p = subprocess.run(cmd, **kwargs)
    if p.returncode:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{p.stderr.strip()}")
    s = p.stdout.strip()
    return json.loads(s) if s.startswith(("{","[")) else s

def write(*parts, input_obj=None):
    if args.dry_run:
        print("DRY RUN:", " ".join(map(str,parts)))
        return None
    return gh(*parts, input_obj=input_obj)

def sync_milestones():
    current = gh("api",f"repos/{REPO}/milestones?state=all&per_page=100")
    for spec in MILESTONES:
        found = next((x for x in current if x["title"] in (spec["title"],spec["old"])),None)
        data = dict(title=spec["title"],description=spec["description"],due_on=spec["due"])
        if found:
            number=found["number"]
            write("api",f"repos/{REPO}/milestones/{number}","--method","PATCH","--input","-",input_obj=data)
            print(f"Updated milestone #{number}: {spec['title']}")
        else:
            created=write("api",f"repos/{REPO}/milestones","--method","POST","--input","-",input_obj=data)
            if args.dry_run:
                print(f"Would create {spec['title']} and assign {spec['issues']}")
                continue
            number=created["number"]
            print(f"Created milestone #{number}: {spec['title']}")
        for n in spec["issues"]:
            write("api",f"repos/{REPO}/issues/{n}","--method","PATCH","--input","-",input_obj={"milestone":number})
        print(f"  Mapped {len(spec['issues'])} engineering issues; preserved open/closed state.")

def sync_project():
    projects=gh("project","list","--owner",OWNER,"--limit","100","--format","json").get("projects",[])
    matching=[p for p in projects if p.get("title")==PROJECT_TITLE]
    if not matching:
        matching=[p for p in projects if "veripoc" in p.get("title","").lower()]
    if len(matching)>1:
        raise RuntimeError("More than one VeriPoC project exists; pick one and rename to exact PROJECT_TITLE before syncing.")
    if matching:
        proj=matching[0]
    else:
        proj=write("project","create","--owner",OWNER,"--title",PROJECT_TITLE,"--format","json")
        if args.dry_run:
            print("Would create GitHub Project and add all 23 engineering issues.")
            return
    project_number=proj["number"]
    project_id=gh("project","view",project_number,"--owner",OWNER,"--format","json")["id"]
    print(f"GitHub Project #{project_number}: {proj['title']}")

    def field_map():
        return {f["name"]:f for f in gh("project","field-list",project_number,"--owner",OWNER,"--limit","100","--format","json").get("fields",[])}
    fields=field_map()
    for name in ("Start date","Target date"):
        if name not in fields:
            write("project","field-create",project_number,"--owner",OWNER,"--name",name,"--data-type","DATE","--format","json")
    if not args.dry_run:
        fields=field_map()

    listed=gh("project","item-list",project_number,"--owner",OWNER,"--limit","200","--format","json").get("items",[])
    existing={}
    for item in listed:
        content=item.get("content") or {}
        if isinstance(content,dict) and isinstance(content.get("number"),int):
            existing[content["number"]]=item["id"]

    all_issues=[n for milestone in MILESTONES for n in milestone["issues"]]
    closed={n for n in all_issues if gh("api",f"repos/{REPO}/issues/{n}").get("state")=="closed"}
    for n in all_issues:
        item_id=existing.get(n)
        if not item_id:
            added=write("project","item-add",project_number,"--owner",OWNER,"--url",f"https://github.com/{REPO}/issues/{n}","--format","json")
            if args.dry_run:
                continue
            item_id=added["id"]
        if n in WINDOWS and not args.dry_run:
            for name,date in zip(("Start date","Target date"),WINDOWS[n]):
                write("project","item-edit","--id",item_id,"--project-id",project_id,
                      "--field-id",fields[name]["id"],"--date",date)
        status=fields.get("Status",{})
        opts=status.get("options") or []
        done=next((o for o in opts if o["name"].lower()=="done"),None)
        if n in closed and done and not args.dry_run:
            write("project","item-edit","--id",item_id,"--project-id",project_id,
                  "--field-id",status["id"],"--single-select-option-id",done["id"])
        print(f"  #{n}: {'Done' if n in closed else 'Open'}; {'stretch / unscheduled' if n not in WINDOWS else 'dated'}")

    print(f"Open: https://github.com/users/{OWNER}/projects/{project_number}")
    print("GitHub Projects Roadmap layout may need to be selected manually:")
    print("  Project -> New view (+) -> Roadmap -> Date fields: Start date / Target date.")
    print("  Group by Milestone or sort by Target date; use Board/Table views for execution.")

if __name__=="__main__":
    try:
        gh("--version")
        gh("auth","status")
        if not args.projects_only:
            sync_milestones()
        if not args.milestones_only:
            sync_project()
    except (RuntimeError,KeyError,ValueError) as ex:
        print("ERROR:",ex,file=sys.stderr)
        print("Check 'gh auth login' and 'gh auth refresh -s project' for GitHub Projects.",file=sys.stderr)
        sys.exit(1)
