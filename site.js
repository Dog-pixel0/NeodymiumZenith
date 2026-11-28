/* Neodymium Zenith — shared script for every page.
   Content lives in content.json; photos and clips in images/.
   Add #edit to any page address to edit (Chrome or Edge), then commit + push with GitHub Desktop. */
{
const PAGE=document.body.dataset.page||'home';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const clone=o=>JSON.parse(JSON.stringify(o));
const slug=t=>String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'item';
/* links: [text](https://...) or a bare https:// address */
const LINKRE=/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
const rich=t=>{const keep=[];let h=esc(t);
 h=h.replace(LINKRE,(m,a,u)=>{keep.push(`<a href="${u}" target="_blank" rel="noopener">${a}</a>`);return `\u0000${keep.length-1}\u0000`});
 h=h.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g,u=>`<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//,'')}</a>`);
 return h.replace(/\u0000(\d+)\u0000/g,(m,i)=>keep[i]);};
const plain=t=>String(t||'').replace(LINKRE,'$1');
const social=t=>String(t||'').replace(LINKRE,'$1 ($2)');
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const blobs={};
const safe=p=>/^(images\/[\w.\-]+|https:\/\/\S+)$/.test(String(p||''));
const blob=p=>blobs[p]||(safe(p)?p:'');
const isVid=t=>String(t||'').startsWith('video');
const media=(src,type,alt)=>!src?'':isVid(type)?`<video src="${esc(blob(src))}" controls muted playsinline preload="metadata"></video>`:`<img src="${esc(blob(src))}" alt="${esc(alt)}" loading="lazy">`;
const linkOk=u=>/^https:\/\//i.test(String(u||''));
const pageLink=u=>linkOk(u)||/^[\w-]+\.html(#[\w-]+)?$/.test(String(u||''));
const ytId=u=>{const m=String(u||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);return m?m[1]:null};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmtDate=d=>{const x=new Date(String(d)+'T12:00:00');return isNaN(x)?esc(d):x.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};

const LISTS=['stats','members','mentors','coaches','impact','events','principles','steps','media','posts','notes'];
const SCHEMA={
 hero:{label:'hero',single:true,fields:[['teamNo','Team number'],['tagline','Tagline','area'],['feedTitle','Feed heading on the home page (leave empty to hide it)'],['siteUrl','Site address (for sharing links and RSS), e.g. https://yourname.github.io/neodymium-zenith/']],img:'heroImg',imgLabel:"This season's robot photo"},
 stats:{label:'stat',fields:[['n','Number'],['l','Label']]},
 members:{label:'team member',fields:[['name','Name'],['role','Role'],['bio','Description','area']],img:'img',imgLabel:'Photo'},
 mentors:{label:'mentor',fields:[['name','Name'],['role','Role'],['bio','Description','area']],img:'img',imgLabel:'Photo'},
 coaches:{label:'coach',fields:[['name','Name'],['role','Role'],['bio','Description','area']],img:'img',imgLabel:'Photo'},
 impact:{label:'impact number',fields:[['n','Number'],['l','Label']]},
 events:{label:'outreach event',fields:[['date','Date'],['title','Event'],['desc','Description','area']],img:'img',imgLabel:'Photo or short video',vid:true},
 principles:{label:'design principle',fields:[['title','Principle'],['text','Description','area']],img:'img',imgLabel:'Image'},
 steps:{label:'process step',fields:[['title','Step'],['text','Description','area']],img:'img',imgLabel:'Image'},
 media:{label:'CAD design or video',fields:[['type','Type','sel:CAD|Video'],['title','Title'],['desc','Description','area'],['url','Link (Onshape, YouTube…) — optional']],img:'img',imgLabel:'Image, render or video file',vid:true},
 posts:{label:'build guide',fields:[['title','Title'],['author','Author'],['tag','Topic'],['date','Date'],['body','Guide (blank line between paragraphs)','area']]},
 notes:{label:'lab note',fields:[['text','Note','area'],['author','Author'],['date','Date','date'],['tags','Tags (comma separated, e.g. Build, CAD)'],['youtube','YouTube link — optional (plays inside the post)'],['link','Link — optional (a website, or a page like guides.html)'],['linkLabel','Link text — optional']],multi:true,limit:500,noMove:true,arrays:['tags']}
};
const norm=c=>{c=Object.assign({},c);for(const k of LISTS)if(!Array.isArray(c[k]))c[k]=[];return c};

let draft=norm({tagline:'',stats:[]}),dir=null,pending=null,dirty=false;
let editing=false,owner=false,undoStack=[],filter='all',shown=10;

/* ---------- shared page chrome ---------- */
const NAV=[['home','index.html','Home'],['team','team.html','Team'],['design','design.html','Design & CAD'],['outreach','outreach.html','Outreach'],['guides','guides.html','Build guides']];
const logo=`<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M5 4h6v12a3 3 0 0 0 6 0V4h6v12a9 9 0 0 1-18 0z" fill="#8f7cff"/><rect x="5" y="4" width="6" height="4" fill="#2ef2ff"/><rect x="17" y="4" width="6" height="4" fill="#2ef2ff"/></svg>`;
document.body.insertAdjacentHTML('afterbegin',`<div id="glow"></div><nav aria-label="Main"><div class="wrap"><a class="logo" href="index.html">${logo}Neodymium <b>Zenith</b></a><div class="links">${NAV.map(([p,h,l])=>`<a href="${h}"${p===PAGE?' aria-current="page"':''}>${l}</a>`).join('')}</div></div></nav>`);
document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap"><span>© ${new Date().getFullYear()} Neodymium Zenith · FIRST Tech Challenge <span id="rssLink" hidden> · <a href="feed.xml" style="color:inherit">RSS feed</a></span></span><span>FIRST® and FIRST Tech Challenge are trademarks of FIRST.</span></div></footer>
<div id="ownerBar" role="region" aria-label="Editing controls"><div class="seg"><button id="mEdit" aria-pressed="true">Edit</button><button id="mView" aria-pressed="false">Preview</button></div><span id="status">Loading…</span><button class="btn sm solid hl" id="connect">Connect site folder</button><button class="btn sm hl" id="undo" disabled>Undo</button><button class="btn sm hl" id="dl">Download content.json</button></div>
<dialog id="reader"><button class="btn sm hl close" data-close>Close</button><div class="rbody" id="readerBody"></div></dialog>
<dialog id="editor"><button class="btn sm hl close" data-close>Close</button><h2 id="edTitle">Edit</h2><form class="ed" id="edForm"></form></dialog>
<dialog id="lightbox" class="lb" aria-label="Photo"><button class="btn sm hl close" data-close>Close</button><img id="lbImg" alt=""></dialog>`);

/* ---------- cards ---------- */
const cadSvg=`<svg viewBox="0 0 160 100"><g stroke="#251b52" stroke-width=".6">${[0,1,2,3,4,5,6,7].map(i=>`<line x1="0" y1="${i*14}" x2="160" y2="${i*14}"/>`).join('')}</g><g fill="none" stroke="#8f7cff" stroke-width="1.4"><path d="M40 60 L80 40 L120 60 L80 80 Z"/><path d="M40 60 V72 L80 92 L120 72 V60"/><path d="M80 80 V92"/><path d="M70 45 V15 L80 10 L90 15 V45"/><path d="M90 15 L100 20 V50"/></g></svg>`;
const vidSvg=`<svg viewBox="0 0 160 100"><rect width="160" height="100" fill="#100c2a"/><circle cx="80" cy="50" r="20" fill="#8f7cff"/><path d="M74 40 L92 50 L74 60 Z" fill="#000"/></svg>`;
const ytEmbed=u=>{const id=ytId(u);if(!id)return '';return `<div class="yt${/\/shorts\//.test(u)?' short':''}"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`};
const mediaThumb=it=>{if(it.img)return media(it.img,it.imgType,it.title);const id=ytId(it.url);if(id)return `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${esc(it.title)}" loading="lazy">`;return it.type==='Video'?vidSvg:cadSvg};
const noteMedia=n=>{const m=(n.media||[]).filter(x=>x&&x.src).slice(0,4);if(!m.length)return '';
 return `<div class="mgrid n${m.length}">${m.map(x=>isVid(x.type)?`<video src="${esc(blob(x.src))}" muted loop playsinline preload="metadata" data-auto></video>`:`<img src="${esc(blob(x.src))}" alt="" loading="lazy" data-act="zoom">`).join('')}</div>`};
const ICON={share:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',link:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',heart:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.3 4.4 6.7C19.5 15.4 12 20 12 20Z"/></svg>',eye:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',check:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>'};
const CARD={
 stats:it=>`${esc(it.n)}<small>${esc(it.l)}</small>`,
 members:it=>`${it.img?`<div class="face">${media(it.img,it.imgType,it.name)}</div>`:`<div class="avatar">${esc(ini(it.name))}</div>`}<h3>${esc(it.name)}</h3><div class="role">${esc(it.role)}</div><p>${rich(it.bio)}</p>`,
 impact:it=>`<b>${esc(it.n)}</b>${esc(it.l)}`,
 events:it=>`<time>${esc(it.date)}</time><div><h3 style="font-size:19px">${esc(it.title)}</h3><p>${rich(it.desc)}</p></div>${it.img?`<div class="evimg">${media(it.img,it.imgType,it.title)}</div>`:'<span></span>'}`,
 principles:it=>`${it.img?`<div class="thumb">${media(it.img,it.imgType,it.title)}</div>`:''}<h3>${esc(it.title)}</h3><p>${rich(it.text)}</p>`,
 media:it=>`<div class="thumb">${mediaThumb(it)}</div><span class="chip">${it.type==='Video'?'Video':'CAD design'}</span><h3>${esc(it.title)}</h3><p>${rich(it.desc)}</p>${linkOk(it.url)?`<a class="btn sm hl" href="${esc(it.url)}" target="_blank" rel="noopener">Open ${it.type==='Video'?'video':'CAD model'}</a>`:''}`,
 posts:it=>`<span class="chip">${esc(it.tag||'Guide')}</span><h3>${esc(it.title)}</h3><p>${esc(plain(String(it.body||'').split('\n')[0]).slice(0,140))}…</p><div class="meta">${esc(it.author)} · ${esc(it.date)}</div>`,
 notes:n=>`<header class="nh"><div class="avatar sm">${esc(ini(n.author))}</div><div><strong>${esc(n.author||'Neodymium Zenith')}</strong><time datetime="${esc(n.date)}">${fmtDate(n.date)}</time></div></header>
  <div class="ntext">${rich(n.text)}</div>${noteMedia(n)}${ytEmbed(n.youtube)}
  ${pageLink(n.link)?`<a class="nlink" href="${esc(n.link)}"${linkOk(n.link)?' target="_blank" rel="noopener"':''}>${esc(n.linkLabel||'Read more')} →</a>`:''}
  <div class="nf"><span class="ntags">${(n.tags||[]).map(t=>`<button class="chip" data-act="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</span>
  <span class="nact"><button class="stat love${loved.has(n.id)?' on':''}" data-act="love" aria-pressed="${loved.has(n.id)}" title="${loved.has(n.id)?'You loved this':'Love this post'}">${ICON.heart}<span class="lc"></span></button><span class="stat vw" title="Views">${ICON.eye}<span class="vc"></span></span><button class="iconbtn" data-act="copy" title="Copy for social media" aria-label="Copy for social media">${ICON.share}</button><a class="iconbtn" href="#note-${esc(n.id)}" data-act="perm" title="Link to this post" aria-label="Link to this post">${ICON.link}</a></span></div>`
};
CARD.mentors=CARD.members;CARD.coaches=CARD.members;CARD.steps=CARD.principles;
const CLS={events:'ev',posts:'post',notes:'note'};
const ELID={media:'media_'};
const toolsFor=k=>`<div class="tools">${SCHEMA[k].noMove?'':'<button data-act="left" aria-label="Move earlier">←</button><button data-act="right" aria-label="Move later">→</button>'}<button data-act="edit">Edit</button><button class="del" data-act="del">Delete</button></div>`;
const sortedNotes=()=>draft.notes.map((n,i)=>[n,i]).sort((a,b)=>String(b[0].date).localeCompare(String(a[0].date))||b[1]-a[1]);

/* ---------- views + loves (stored in GoatCounter, no accounts needed) ---------- */
const GC=(document.querySelector('script[data-goatcounter]')?.dataset.goatcounter||'').replace(/\/count$/,'');
const store=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify(v))}catch(_){return []}};
const loved=new Set(store('nzLoved'));
const seen=new Set((()=>{try{return JSON.parse(sessionStorage.getItem('nzSeen')||'[]')}catch(_){return []}})());
const stats={};
const short=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':n>=1e4?Math.round(n/1e3)+'K':n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':String(n);
async function gcGet(path){
 if(!GC)return null;
 try{const r=await fetch(GC+'/counter/'+encodeURIComponent(path)+'.json');if(r.status===404)return 0;if(!r.ok)return null;const j=await r.json();return parseInt(String(j.count).replace(/\D/g,''),10)||0}catch(_){return null}
}
function gcSend(path,title,tries=0){
 if(owner)return;
 const g=window.goatcounter;
 if(g&&typeof g.count==='function'){try{g.count({path,title,event:false})}catch(_){}return}
 if(tries<20)setTimeout(()=>gcSend(path,title,tries+1),500);
}
function paintStats(id){
 const el=document.getElementById('note-'+id);if(!el)return;const st=stats[id]||{};
 const v=st.v,l=Math.max(st.l??0,loved.has(id)?1:0);
 const vw=el.querySelector('.vw');if(vw){vw.hidden=v==null;vw.querySelector('.vc').textContent=v==null?'':short(v);vw.title=v==null?'':`${v.toLocaleString()} view${v===1?'':'s'}`}
 const lc=el.querySelector('.lc');if(lc)lc.textContent=l?short(l):'';
}
function loadStats(ids){
 for(const id of ids){
  if(stats[id]){paintStats(id);continue}
  stats[id]={v:null,l:null};
  Promise.all([gcGet('/note/'+id),gcGet('/love/'+id)]).then(([v,l])=>{stats[id].v=v;stats[id].l=l;paintStats(id)});
 }
}
let vio=null;const vtimers={};
function watchViews(){
 if(!('IntersectionObserver' in window))return;
 if(!vio)vio=new IntersectionObserver(es=>es.forEach(e=>{const id=e.target.dataset.nid;if(!id||seen.has(id))return;
  if(e.isIntersecting){vtimers[id]=setTimeout(()=>{if(seen.has(id))return;seen.add(id);try{sessionStorage.setItem('nzSeen',JSON.stringify([...seen]))}catch(_){}
   const n=draft.notes.find(x=>x.id===id);gcSend('/note/'+id,'Note: '+plain(n?.text||'').slice(0,60));
   if(stats[id]&&stats[id].v!=null&&!owner){stats[id].v++;paintStats(id)}},1000)}
  else clearTimeout(vtimers[id])}),{threshold:.5});
 document.querySelectorAll('#notes .note[data-nid]').forEach(el=>{if(!el.dataset.vw){el.dataset.vw=1;vio.observe(el)}});
}

/* ---------- render ---------- */
function render(){
 const c=draft;
 document.body.classList.toggle('editing',editing);
 if($('tagline'))$('tagline').innerHTML=`FIRST Tech Challenge Team #${esc(c.teamNo||'—')} · ${rich(c.tagline||'')}`;
 if($('heroPhoto')){
  $('drawnBot').style.display=c.heroImg?'none':'';
  $('heroPhoto').innerHTML=c.heroImg?`<div class="photo-wrap">${media(c.heroImg,c.heroType,"This season's robot")}</div>`
   :editing?`<div class="ph"><strong style="font:700 22px 'Chakra Petch'">Add this season's robot</strong><span style="color:var(--dim)">Upload a photo to replace the drawing.</span><button class="btn solid hl" data-act="edit" data-k="hero">Upload robot photo</button></div>`:'';
 }
 for(const k of LISTS){
  if(k==='notes')continue;
  const el=$(ELID[k]||k);if(!el)continue;
  let items=c[k].map((it,i)=>[it,i]);
  if(k==='media'&&filter!=='all')items=items.filter(([it])=>(it.type||'CAD')===filter);
  if(k==='posts'&&$('q')){const q=$('q').value.toLowerCase();if(q)items=items.filter(([it])=>[it.title,it.body,it.tag,it.author].join(' ').toLowerCase().includes(q))}
  el.innerHTML=items.map(([it,i])=>`<article class="card hl ${CLS[k]||''}" data-k="${k}" data-i="${i}"${k==='posts'?` id="guide-${slug(it.title)}" data-act="read" tabindex="0"`:''}>${toolsFor(k)}${CARD[k](it)}</article>`).join('')
   +`<button class="add hl" data-act="add" data-k="${k}">+ Add ${SCHEMA[k].label}</button>`
   +(!items.length&&!editing&&k!=='stats'?`<p class="lede">${k==='posts'&&$('q')?.value?'No guides match that search.':'Coming soon.'}</p>`:'');
 }
 renderNotes();renderSide();renderBar();
}
function renderNotes(){
 const el=$('notes');if(!el)return;
 const all=sortedNotes();
 const q=($('nq')?.value||'').trim().toLowerCase();
 const list=all.filter(([n])=>!q||[n.text,n.author,(n.tags||[]).join(' '),n.linkLabel].join(' ').toLowerCase().includes(q));
 const ft=draft.feedTitle===undefined?'Discover':String(draft.feedTitle).trim();
 $('feedTitle').textContent=ft;$('feedTitle').hidden=!ft;
 el.innerHTML=list.slice(0,shown).map(([n,i])=>`<article class="card note" id="note-${esc(n.id)}" data-nid="${esc(n.id)}" data-k="notes" data-i="${i}">${toolsFor('notes')}${CARD.notes(n)}</article>`).join('')
  ||`<div class="card empty">${q?`Nothing in the feed matches “${esc(q)}”.`:editing?'No notes yet — click “+ New note” to post the first one.':'New posts are coming soon.'}</div>`;
 $('more').hidden=list.length<=shown;
 watchVideos();watchViews();loadStats(list.slice(0,shown).map(([n])=>n.id));
}
function renderSide(){
 const el=$('side');if(!el)return;
 const c=draft,g=c.posts[c.posts.length-1],ev=c.events[c.events.length-1];
 el.innerHTML=`<div class="card"><h3>The team</h3><div class="faces">${c.members.map(m=>m.img?`<span>${media(m.img,m.imgType,m.name)}</span>`:`<span>${esc(ini(m.name))}</span>`).join('')}</div><p>${c.members.length} students, ${c.mentors.length+c.coaches.length} mentors and coaches.</p><a class="btn sm hl" href="team.html${owner?'#edit':''}">Meet the team</a></div>`
 +(g?`<div class="card"><h3>Latest build guide</h3><a class="big" href="guides.html#guide-${slug(g.title)}">${esc(g.title)}</a><p>${esc(g.author)} · ${esc(g.date)}</p><a class="btn sm hl" href="guides.html${owner?'#edit':''}">All build guides</a></div>`:'')
 +(ev?`<div class="card"><h3>Recent outreach</h3><a class="big" href="outreach.html${owner?'#edit':''}">${esc(ev.title)}</a><p>${esc(ev.date)}</p></div>`:'')
 +`<div class="card"><h3>See the robot</h3><p>CAD models, test clips and match videos.</p><a class="btn sm hl" href="design.html${owner?'#edit':''}">Design &amp; CAD</a></div>`;
}
let io=null;
function watchVideos(){
 if(!('IntersectionObserver' in window))return;
 if(!io)io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){const p=v.play();if(p)p.catch(()=>{})}else v.pause()}),{threshold:.6});
 document.querySelectorAll('video[data-auto]').forEach(v=>{if(!v.dataset.w){v.dataset.w=1;if(matchMedia('(prefers-reduced-motion: reduce)').matches){v.controls=true;return}io.observe(v);v.addEventListener('click',()=>{v.controls=true;v.muted=false})}});
}

/* ---------- edit bar + saving ---------- */
const FS='showDirectoryPicker' in window;
let saveState='';
const setSave=x=>{saveState=x;renderBar()};
function renderBar(){
 if(!owner)return;
 $('mEdit').setAttribute('aria-pressed',editing);$('mView').setAttribute('aria-pressed',!editing);
 $('undo').disabled=!undoStack.length;
 $('connect').textContent=dir?'Folder: '+dir.name:pending?'Reconnect folder: '+pending.name:'Connect site folder';
 $('connect').style.display=FS?'':'none';
 if(saveState)return void($('status').innerHTML=saveState);
 $('status').innerHTML=!editing?'Preview — this is what visitors will see.'
  :!FS?'<b>Use Chrome or Edge</b> to save straight into your folder. Here, use Download content.json.'
  :pending?'<b>Click Reconnect folder</b> to keep saving on this page.'
  :!dir?'<b>Connect your site folder</b> so changes and photos are saved.'
  :!linkOk(String(draft.siteUrl||'').trim())?'Saved. <b>Add your Site address</b> (Edit hero text &amp; photo) to turn on the RSS feed.'
  :'Saved to your folder. Commit and push in GitHub Desktop to publish.';
}
async function writeFile(d,name,data){const h=await d.getFileHandle(name,{create:true});const w=await h.createWritable();await w.write(data);await w.close()}
const siteBase=()=>{let u=String(draft.siteUrl||'').trim();if(!linkOk(u))u=location.origin+location.pathname.replace(/[^/]*$/,'');return u.endsWith('/')?u:u+'/'};
function rss(){
 const b=siteBase(),x=s=>esc(s);
 const items=sortedNotes().slice(0,30).map(([n])=>{const t=plain(n.text).replace(/\s+/g,' ').trim();return `<item><title>${x(t.length>80?t.slice(0,77)+'…':t)}</title><link>${x(b+'#note-'+n.id)}</link><guid isPermaLink="false">${x(n.id)}</guid><pubDate>${new Date(String(n.date)+'T12:00:00Z').toUTCString()}</pubDate><description>${x(social(n.text))}</description></item>`}).join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Neodymium Zenith — Lab notes</title><link>${x(b)}</link><description>Build logs and robotics notes from FTC Team #${x(draft.teamNo||'')}</description>\n${items}\n</channel></rss>\n`;
}
let saving=false,again=false;
async function save(){
 if(!dir){if(dirty)renderBar();return}
 if(saving){again=true;return}
 saving=true;setSave('Saving…');
 try{await writeFile(dir,'content.json',JSON.stringify(draft,null,2));if(linkOk(String(draft.siteUrl||'').trim())){await writeFile(dir,'feed.xml',rss());$('rssLink').hidden=false}dirty=false;setSave('')}
 catch(e){setSave("<b>Couldn't save</b> — reconnect the folder and try again.")}
 saving=false;if(again){again=false;save()}
}
function commit(fn){
 undoStack.push(JSON.stringify(draft));if(undoStack.length>40)undoStack.shift();
 dirty=true;fn(draft);render();save();
}
async function loadBlobs(){
 if(!dir)return;
 let imgs;try{imgs=await dir.getDirectoryHandle('images')}catch(_){return}
 const paths=new Set();JSON.stringify(draft,(k,v)=>{if(typeof v==='string'&&v.startsWith('images/'))paths.add(v);return v});
 for(const p of paths){try{const f=await (await imgs.getFileHandle(p.slice(7))).getFile();blobs[p]=URL.createObjectURL(f)}catch(_){}}
}
async function saveUpload(file){
 const ext=(file.name.match(/\.[a-z0-9]+$/i)||[''])[0].toLowerCase();
 const base=file.name.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)||'image';
 const name=base+'-'+Date.now().toString(36)+ext;
 const imgs=await dir.getDirectoryHandle('images',{create:true});
 await writeFile(imgs,name,file);
 const p='images/'+name;blobs[p]=URL.createObjectURL(file);return p;
}
/* remember the connected folder between pages */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('nz-site',1);r.onupgradeneeded=()=>r.result.createObjectStore('h');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbSet=async(k,v)=>{try{const d=await idb();d.transaction('h','readwrite').objectStore('h').put(v,k)}catch(_){}};
const idbGet=async k=>{try{const d=await idb();return await new Promise(r=>{const q=d.transaction('h').objectStore('h').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(_){return null}};
async function adopt(d){
 try{await d.getFileHandle('index.html')}catch(_){setSave("<b>That folder has no index.html</b> — pick the folder this site lives in.");return false}
 let found=false;
 try{const f=await (await d.getFileHandle('content.json')).getFile();draft=norm(JSON.parse(await f.text()));found=true}catch(_){}
 dir=d;pending=null;undoStack=[];idbSet('dir',d);await loadBlobs();
 if(!found||linkOk(String(draft.siteUrl||'').trim()))await save();
 setSave('');render();return true;
}

/* ---------- clicks ---------- */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const art=b.closest('[data-k]');const k=b.dataset.k||art?.dataset.k;const i=art?+art.dataset.i:-1;
 const act=b.dataset.act;
 if(act==='read'){if(e.target.closest('a'))return;openGuide(i);return}
 if(act==='tag'){e.preventDefault();const q=$('nq');if(!q)return;q.value=b.dataset.tag;shown=10;renderNotes();q.scrollIntoView({behavior:'smooth',block:'center'});return}
 if(act==='zoom'){$('lbImg').src=b.src;$('lightbox').showModal();return}
 if(act==='copy'){const n=draft.notes[i];if(!n)return;
  const t=social(n.text).trim()+'\n\n'+siteBase()+'#note-'+n.id;
  const done=()=>{b.innerHTML=ICON.check;b.classList.add('done');b.title='Copied';setTimeout(()=>{b.innerHTML=ICON.share;b.classList.remove('done');b.title='Copy for social media'},1600)};
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(done).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(_){}ta.remove()});return}
 if(act==='love'){const id=draft.notes[i]?.id;if(!id)return;
  if(loved.has(id)){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');return}
  loved.add(id);store('nzLoved',[...loved]);stats[id]=stats[id]||{v:null,l:0};stats[id].l=(stats[id].l||0)+1;
  b.classList.add('on','pop');b.setAttribute('aria-pressed','true');b.title='You loved this';paintStats(id);
  gcSend('/love/'+id,'Love: '+plain(draft.notes[i].text).slice(0,60));return}
 if(act==='perm'){e.preventDefault();const id=b.getAttribute('href').slice(1);if(!owner)history.replaceState(null,'','#'+id);flash(id);return}
 if(!editing)return;
 e.stopPropagation();e.preventDefault();
 if(act==='edit')openEditor(k,k==='hero'?-1:i);
 else if(act==='add')openEditor(k,-1);
 else if(act==='del')commit(d=>d[k].splice(i,1));
 else if(act==='left'||act==='right'){const j=act==='left'?i-1:i+1;if(j<0||j>=draft[k].length)return;commit(d=>{[d[k][i],d[k][j]]=[d[k][j],d[k][i]]})}
},true);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.post'))e.target.click()});
function openGuide(i){const p=draft.posts[i];if(!p)return;
 $('readerBody').innerHTML=`<span class="chip">${esc(p.tag||'Guide')}</span><h2>${esc(p.title)}</h2><p class="note">${esc(p.author)} · ${esc(p.date)}</p>`+String(p.body||'').split(/\n\s*\n/).map(x=>`<p>${rich(x)}</p>`).join('');
 $('reader').showModal()}
function flash(id){const el=$(id);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),2400)}

/* ---------- editor ---------- */
function openEditor(k,i){
 const sc=SCHEMA[k];const isNew=!sc.single&&i<0;
 const obj=sc.single?draft:isNew?(k==='notes'?{date:today(),author:''}:{}):draft[k][i];
 const imgF=sc.img,typeF=k==='hero'?'heroType':'imgType';
 let img=imgF?obj[imgF]||null:null,imgType=imgF?obj[typeF]||null:null;
 let list=sc.multi?clone(obj.media||[]):null;
 $('edTitle').textContent=(sc.single?'Edit hero':isNew?(k==='notes'?'New lab note':'Add '+sc.label):'Edit '+sc.label);
 const f=$('edForm');
 f.innerHTML=sc.fields.map(([n,l,t],x)=>{
  const id='f'+x;let v=obj[n]??'';if(Array.isArray(v))v=v.join(', ');
  if(t==='area')return `<label for="${id}">${esc(l)}</label><textarea id="${id}" name="${n}"${x===0?' required':''}>${esc(v)}</textarea>${sc.limit&&x===0?'<div class="count" id="cnt"></div>':''}`;
  if(t&&t.startsWith('sel:'))return `<label for="${id}">${esc(l)}</label><select id="${id}" name="${n}">${t.slice(4).split('|').map(o=>`<option${o===v?' selected':''}>${o}</option>`).join('')}</select>`;
  return `<label for="${id}">${esc(l)}</label><input id="${id}" name="${n}"${t==='date'?' type="date"':''} value="${esc(v)}"${x===0?' required':''}>`;
 }).join('')
 +(imgF?`<label>${esc(sc.imgLabel)}</label><div class="imgfield"><div class="prev" id="prev"></div><label class="btn sm hl">Choose file<input type="file" id="imgIn" accept="image/*${sc.vid?',video/*':''}" hidden></label><button type="button" class="btn sm hl" id="imgRm">Remove</button><span id="upst" class="note" style="margin:0"></span></div>`:'')
 +(sc.multi?`<label>Photos &amp; video clips (up to 4)</label><div class="imgfield"><div class="mlist" id="mlist"></div><label class="btn sm hl">Add files<input type="file" id="mIn" accept="image/*,video/*" multiple hidden></label><span id="upst" class="note" style="margin:0"></span></div>`:'')
 +(sc.fields.some(x=>x[2]==='area')?`<p class="note" style="margin:0">To add a link in the text, write <code>[link text](https://example.com)</code> or paste a full https:// address.</p>`:'')
 +`<div class="formbtns"><button type="button" class="btn hl" data-close>Cancel</button><button class="btn solid hl" id="edSave">${k==='notes'&&isNew?'Post':'Save'}</button></div>`;
 const need=m=>{$('upst').textContent=FS?'Connect your site folder first (button at the bottom of the page).':'Saving photos and videos needs Chrome or Edge.';return !dir};
 if(sc.limit){const ta=f.elements[sc.fields[0][0]],c=$('cnt');const up=()=>{const n=ta.value.length;c.textContent=n>sc.limit?`${n}/${sc.limit} — too long for most social posts`:`${n}/${sc.limit}`;c.classList.toggle('over',n>sc.limit)};ta.addEventListener('input',up);up()}
 if(imgF){
  const showPrev=()=>{$('prev').innerHTML=img?media(img,imgType,'Preview'):'No image'};showPrev();
  $('imgRm').onclick=()=>{img=null;imgType=null;showPrev()};
  $('imgIn').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;if(!dir&&need())return;
   $('upst').textContent='Saving…';$('edSave').disabled=true;
   try{img=await saveUpload(file);imgType=file.type;showPrev();$('upst').textContent='Saved to '+img}catch(err){$('upst').textContent="Couldn't save the file. Try again."}
   $('edSave').disabled=false;ev.target.value=''};
 }
 if(sc.multi){
  const showList=()=>{$('mlist').innerHTML=list.map((m,j)=>`<div class="mi">${isVid(m.type)?`<video src="${esc(blob(m.src))}" muted playsinline preload="metadata"></video>`:`<img src="${esc(blob(m.src))}" alt="">`}<button type="button" data-rm="${j}" aria-label="Remove">×</button></div>`).join('')||'<span class="note" style="margin:0">No photos or clips yet.</span>'};
  showList();
  $('mlist').onclick=ev=>{const r=ev.target.closest('[data-rm]');if(r){list.splice(+r.dataset.rm,1);showList()}};
  $('mIn').onchange=async ev=>{const files=[...ev.target.files];ev.target.value='';if(!files.length)return;if(!dir&&need())return;
   const room=4-list.length;if(room<=0){$('upst').textContent='A note can hold up to 4 photos or clips.';return}
   $('edSave').disabled=true;let msg='';
   for(const file of files.slice(0,room)){
    if(file.size>25*1024*1024){msg=`${file.name} is over 25 MB — GitHub's website won't accept it. Shorten it or post it to YouTube.`;continue}
    $('upst').textContent='Saving '+file.name+'…';
    try{list.push({src:await saveUpload(file),type:file.type});showList()}catch(err){msg="Couldn't save "+file.name}
   }
   if(files.length>room)msg='Only the first '+room+' were added — a note holds up to 4.';
   $('upst').textContent=msg||'Saved.';$('edSave').disabled=false};
 }
 f.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('editor').close());
 f.onsubmit=ev=>{
  ev.preventDefault();
  const vals={};for(const[n]of sc.fields)vals[n]=f.elements[n].value.trim();
  for(const a of sc.arrays||[])vals[a]=vals[a]?vals[a].split(',').map(s=>s.trim()).filter(Boolean):[];
  if(imgF){vals[imgF]=img;vals[typeF]=imgType}
  if(sc.multi)vals.media=list;
  if(k==='notes'&&isNew)vals.id=(vals.date||today())+'-'+Math.random().toString(36).slice(2,6);
  commit(d=>{if(sc.single)Object.assign(d,vals);else if(isNew)d[k].push(vals);else Object.assign(d[k][i],vals)});
  $('editor').close();
 };
 $('editor').showModal();
}

/* ---------- wiring ---------- */
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
document.querySelectorAll('.tabs[data-for=media] button').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.tabs[data-for=media] button').forEach(x=>x.setAttribute('aria-selected',x===b));filter=b.dataset.f;render()}));
$('q')?.addEventListener('input',render);
$('nq')?.addEventListener('input',()=>{shown=10;renderNotes()});
$('more')?.addEventListener('click',()=>{shown+=10;renderNotes()});
$('mEdit').onclick=()=>{editing=true;render()};
$('mView').onclick=()=>{editing=false;render()};
$('undo').onclick=()=>{if(!undoStack.length)return;draft=JSON.parse(undoStack.pop());dirty=true;render();save()};
$('dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}));a.download='content.json';document.body.appendChild(a);a.click();a.remove()};
$('connect').onclick=async()=>{
 try{
  if(pending){if(await pending.requestPermission({mode:'readwrite'})==='granted'){await adopt(pending);return}}
  const d=await showDirectoryPicker({id:'nz-site',mode:'readwrite'});await adopt(d);
 }catch(e){if(e&&e.name!=='AbortError')setSave("<b>Couldn't open that folder.</b>")}
};
const setMode=async()=>{
 owner=location.hash==='#edit';editing=owner;document.body.classList.toggle('owner',owner);
 document.querySelectorAll('nav .links a,.logo').forEach(a=>{a.href=a.getAttribute('href').replace(/#edit$/,'')+(owner?'#edit':'')});
 if(owner&&FS&&!dir&&!pending){const h=await idbGet('dir');if(h){try{if(await h.queryPermission({mode:'readwrite'})==='granted')await adopt(h);else pending=h}catch(_){}}}
 render();
};
addEventListener('hashchange',setMode);
addEventListener('beforeunload',e=>{if(owner&&dirty&&!dir){e.preventDefault();e.returnValue=''}});

/* load published content */
(async()=>{
 try{const r=await fetch('content.json',{cache:'no-store'});if(r.ok)draft=norm(await r.json())}catch(_){}
 await setMode();
 fetch('feed.xml',{method:'HEAD',cache:'no-store'}).then(r=>{if(r.ok)$('rssLink').hidden=false}).catch(()=>{});
 const h=location.hash.slice(1);
 if(h.startsWith('note-')){const idx=sortedNotes().findIndex(([n])=>'note-'+n.id===h);if(idx>=shown){shown=idx+1;renderNotes()}flash(h)}
 if(h.startsWith('guide-')){const i=draft.posts.findIndex(p=>'guide-'+slug(p.title)===h);if(i>=0)openGuide(i)}
})();
render();
const g=$('glow');
addEventListener('pointermove',e=>{g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'},{passive:true});
}
