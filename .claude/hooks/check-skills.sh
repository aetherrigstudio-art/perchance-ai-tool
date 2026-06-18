#!/usr/bin/env bash
# Skills lock-sync check. Asserts that skills-lock.json, the installed skill
# content in .agents/skills/, and the .claude/skills/ discovery symlinks all
# agree. Catches the drift that creeps in when `npx skills add/remove` writes
# one place but not the others (display-name vs slug keys, failed installs left
# in the lock, dangling symlinks). Exit 0 = in sync, 1 = drift found.
#
# Run manually:  bash .claude/hooks/check-skills.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

node -e '
const fs=require("fs");
let problems=[];

// 1. lock keys  <->  .agents/skills dirs
const lock=Object.keys(JSON.parse(fs.readFileSync("skills-lock.json","utf8")).skills);
const dirs=fs.readdirSync(".agents/skills").filter(d=>{
  try { return fs.statSync(".agents/skills/"+d).isDirectory(); } catch { return false; }
});
const lockSet=new Set(lock), dirSet=new Set(dirs);
lock.filter(k=>!dirSet.has(k)).forEach(k=>problems.push("in lock but NOT installed: "+k));
dirs.filter(d=>!lockSet.has(d)).forEach(d=>problems.push("installed but NOT in lock: "+d));

// 2. each lock entry has a SKILL.md on disk
for(const d of dirs){
  if(!fs.existsSync(".agents/skills/"+d+"/SKILL.md"))
    problems.push("missing SKILL.md: .agents/skills/"+d);
}

// 3. .claude/skills symlinks all resolve (skip real dirs like run-perchance-ai-tool)
if(fs.existsSync(".claude/skills")){
  for(const e of fs.readdirSync(".claude/skills")){
    const p=".claude/skills/"+e;
    let st; try { st=fs.lstatSync(p); } catch { continue; }
    if(st.isSymbolicLink() && !fs.existsSync(p))
      problems.push("dangling symlink: "+p+" -> "+fs.readlinkSync(p));
  }
}

if(problems.length){
  console.error("skills: DRIFT ("+problems.length+")");
  problems.forEach(p=>console.error("  - "+p));
  process.exit(1);
}
console.log("skills: in sync ("+dirs.length+" skills, lock + content + symlinks agree)");
'
