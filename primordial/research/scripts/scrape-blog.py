import urllib.request, re, time, os, html as htmllib
from html.parser import HTMLParser

SLUGS = """claude-code-best-practices claude-md-guide context-engineering-claude-code
claude-code-subagents-guide claude-code-agents-guide blog-claude-managed-agents
claude-code-routines-guide claude-code-slash-commands-guide mcp-servers-guide is-mcp-dead
claude-code-auto-memory-guide claude-code-workflows-10x-productivity claude-code-plan-mode-guide
vibe-coding-claude-code claude-code-hooks-guide claude-code-worktrees-guide
claude-code-permissions-guide claude-code-remote-control ultrareview-claude-code-guide
claude-opus-4-7-deep-reasoning claude-opus-4-million-token-era claude-opus-4-8-release
claude-fable-5-guide claude-code-competitors-comparison claude-code-vs-cursor-vs-copilot
best-claude-code-plugins claude-code-cheat-sheet claude-skills-non-coding-use-cases
how-to-create-claude-skills claude-dispatch-guide designing-with-claude
claude-code-for-non-engineers-in-engineering-codebases claude-cowork-for-business-users
clawdbot-openclaw-guide anthropic-claude-certification-program claude-code-statusline-guide""".split()

BASE="https://www.claudedirectory.org/blog/"

class MD(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out=[]; self.skip=0; self.tag=[]; self.list=[]; self.href=None; self.pre=0; self.cur=""
    def emit(self,s): self.out.append(s)
    def flush(self):
        t=self.cur.strip()
        if t: self.emit(t+"\n\n")
        self.cur=""
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in("script","style","nav","footer","svg","button"): self.skip+=1; return
        if self.skip: return
        if tag in("h1","h2","h3","h4","h5","h6"):
            self.flush(); self.cur="#"*int(tag[1])+" "
        elif tag=="p": self.flush()
        elif tag in("ul","ol"): self.flush(); self.list.append(tag)
        elif tag=="li":
            n="- " if (self.list and self.list[-1]=="ul") else "1. "
            self.cur=n
        elif tag=="br": self.cur+="\n"
        elif tag in("strong","b"): self.cur+="**"
        elif tag in("em","i"): self.cur+="*"
        elif tag in("code","pre"):
            if tag=="pre": self.flush(); self.cur="```\n"; self.pre=1
            elif not self.pre: self.cur+="`"
        elif tag=="a": self.href=a.get("href"); self.cur+="["
        elif tag=="blockquote": self.flush(); self.cur="> "
        elif tag=="hr": self.flush(); self.emit("---\n\n")
    def handle_endtag(self,tag):
        if tag in("script","style","nav","footer","svg","button"):
            if self.skip: self.skip-=1
            return
        if self.skip: return
        if tag in("h1","h2","h3","h4","h5","h6","p","li","blockquote"): self.flush()
        elif tag in("ul","ol"):
            if self.list: self.list.pop()
            self.emit("\n")
        elif tag in("strong","b"): self.cur+="**"
        elif tag in("em","i"): self.cur+="*"
        elif tag=="code" and not self.pre: self.cur+="`"
        elif tag=="pre": self.cur+="\n```"; self.flush(); self.pre=0
        elif tag=="a":
            if self.href: self.cur+=f"]({self.href})"
            else: self.cur+="]"
            self.href=None
    def handle_data(self,d):
        if self.skip: return
        self.cur+=d if self.pre else re.sub(r"\s+"," ",d)

def article(html):
    m=re.search(r"<article[^>]*>(.*?)</article>", html, re.S|re.I)
    return m.group(1) if m else html

ok=0
for s in SLUGS:
    try:
        req=urllib.request.Request(BASE+s,headers={"User-Agent":"Mozilla/5.0"})
        h=urllib.request.urlopen(req,timeout=25).read().decode("utf-8","replace")
        open(f"/tmp/claudedirectory/html/{s}.html","w").write(h)
        p=MD(); p.feed(article(h)); p.flush()
        md=re.sub(r"\n{3,}","\n\n","".join(p.out)).strip()
        open(f"/tmp/claudedirectory/md/{s}.md","w").write(f"# source: {BASE+s}\n\n"+md+"\n")
        ok+=1; print(f"[{ok:2}/{len(SLUGS)}] {s}  ({len(md)} md chars)")
        time.sleep(0.25)
    except Exception as e:
        print("FAIL",s,repr(e))
print("DONE",ok,"of",len(SLUGS))
