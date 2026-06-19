import urllib.request, re, os, time, json, threading
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor

ROOT="/tmp/claudedirectory"
SECTIONS=["static","prompts","mcp-servers","hooks","skills","plugins","how-to","agents","topics","use-cases"]  # blog already done
UA={"User-Agent":"Mozilla/5.0 (research crawler; respects robots Allow:/)"}

def get(u,retries=2):
    for i in range(retries+1):
        try:
            return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read().decode("utf-8","replace")
        except Exception as e:
            if i==retries: raise
            time.sleep(0.6*(i+1))

class MD(HTMLParser):
    def __init__(s):
        super().__init__(); s.out=[];s.skip=0;s.list=[];s.href=None;s.pre=0;s.cur=""
    def emit(s,x):s.out.append(x)
    def flush(s):
        t=s.cur.strip()
        if t:s.emit(t+"\n\n")
        s.cur=""
    def handle_starttag(s,tag,attrs):
        a=dict(attrs)
        if tag in("script","style","nav","footer","svg","button","form","aside"):s.skip+=1;return
        if s.skip:return
        if tag in("h1","h2","h3","h4","h5","h6"):s.flush();s.cur="#"*int(tag[1])+" "
        elif tag=="p":s.flush()
        elif tag in("ul","ol"):s.flush();s.list.append(tag)
        elif tag=="li":s.cur=("- " if (s.list and s.list[-1]=="ul") else "1. ")
        elif tag=="br":s.cur+="\n"
        elif tag in("strong","b"):s.cur+="**"
        elif tag in("em","i"):s.cur+="*"
        elif tag=="pre":s.flush();s.cur="```\n";s.pre=1
        elif tag=="code" and not s.pre:s.cur+="`"
        elif tag=="a":s.href=a.get("href");s.cur+="["
        elif tag=="blockquote":s.flush();s.cur="> "
        elif tag=="hr":s.flush();s.emit("---\n\n")
    def handle_endtag(s,tag):
        if tag in("script","style","nav","footer","svg","button","form","aside"):
            if s.skip:s.skip-=1
            return
        if s.skip:return
        if tag in("h1","h2","h3","h4","h5","h6","p","li","blockquote"):s.flush()
        elif tag in("ul","ol"):
            if s.list:s.list.pop()
            s.emit("\n")
        elif tag in("strong","b"):s.cur+="**"
        elif tag in("em","i"):s.cur+="*"
        elif tag=="code" and not s.pre:s.cur+="`"
        elif tag=="pre":s.cur+="\n```";s.flush();s.pre=0
        elif tag=="a":
            s.cur+=(f"]({s.href})" if s.href else "]");s.href=None
    def handle_data(s,d):
        if s.skip:return
        s.cur+= d if s.pre else re.sub(r"\s+"," ",d)

def main_content(html):
    for pat in (r"<article[^>]*>(.*?)</article>", r"<main[^>]*>(.*?)</main>"):
        m=re.search(pat,html,re.S|re.I)
        if m and len(m.group(1))>200: return m.group(1)
    m=re.search(r"<body[^>]*>(.*?)</body>",html,re.S|re.I)
    return m.group(1) if m else html

def title_of(html):
    m=re.search(r"<title[^>]*>(.*?)</title>",html,re.S|re.I)
    return re.sub(r"\s+"," ",m.group(1)).strip() if m else ""

lock=threading.Lock(); done=[0]; fails=[]
def crawl(item):
    sec,url=item
    slug=url.rstrip("/").split("/")[-1] or "index"
    try:
        h=get(url)
        p=MD();p.feed(main_content(h));p.flush()
        md=re.sub(r"\n{3,}","\n\n","".join(p.out)).strip()
        d=f"{ROOT}/md/{sec}"; os.makedirs(d,exist_ok=True)
        rec={"section":sec,"slug":slug,"url":url,"title":title_of(h),"chars":len(md)}
        open(f"{d}/{slug}.md","w").write(f"# source: {url}\n\n"+md+"\n")
        with lock:
            done[0]+=1
            if done[0]%200==0: print("...",done[0],"crawled",flush=True)
        return rec
    except Exception as e:
        with lock: fails.append((url,repr(e)))
        return None

# enumerate
urls=[]
for s in SECTIONS:
    try:
        t=get(f"https://claudedirectory.org/sitemap/{s}.xml")
        for u in re.findall(r"<loc>(.*?)</loc>",t): urls.append((s,u))
    except Exception as e: print("sitemap FAIL",s,e,flush=True)
print("TO CRAWL:",len(urls),flush=True)

recs=[]
with ThreadPoolExecutor(max_workers=8) as ex:
    for r in ex.map(crawl,urls):
        if r: recs.append(r)
print("CRAWLED",len(recs),"FAILED",len(fails),flush=True)

# merge EVERYTHING (blog + new) into one corpus
import glob
corpus=open("/tmp/claudedirectory-corpus.md","w")
corpus.write("# claudedirectory.org — merged corpus\n\n")
allmd=sorted(glob.glob(f"{ROOT}/md/**/*.md",recursive=True))+sorted(glob.glob(f"{ROOT}/md/*.md"))
seen=set(); n=0
for f in allmd:
    if f in seen: continue
    seen.add(f)
    body=open(f).read()
    corpus.write("\n\n<<<<< DOC >>>>>\n"+body.strip()+"\n")
    n+=1
corpus.close()
json.dump({"crawled":len(recs),"failed":len(fails),"docs_in_corpus":n,"records":recs[:5000]},
          open("/tmp/claudedirectory/manifest.json","w"),indent=1)
sz=os.path.getsize("/tmp/claudedirectory-corpus.md")
print(f"CORPUS docs={n} size={sz/1e6:.1f}MB  fails={len(fails)}",flush=True)
if fails[:5]: print("sample fails:",fails[:5],flush=True)
print("ALLDONE",flush=True)
