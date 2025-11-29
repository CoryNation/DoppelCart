let scrollTimer = null;
let keepScrolling = false;

function banner(text, timeoutMs = 1800){
  try{
    let el = document.getElementById('__persona_miner_banner');
    if(!el){
      el = document.createElement('div');
      el.id='__persona_miner_banner';
      el.style.cssText='position:fixed;z-index:999999;top:10px;right:10px;background:rgba(0,0,0,.8);color:#fff;padding:8px 10px;border-radius:8px;font:12px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Arial';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display='block';
    clearTimeout(el.__t);
    el.__t = setTimeout(()=>{ el.style.display='none'; }, timeoutMs);
  }catch(_){}
}

function normText(el){ return (el?.textContent || '').replace(/\s+/g,' ').trim(); }
function clickIfVisible(el){ if(!el) return false; const r = el.getBoundingClientRect(); if(r.width>0 && r.height>0){ el.click(); return true; } return false; }
function findButtonByIncludes(word){
  const els = Array.from(document.querySelectorAll('button, [role="button"]'));
  const w = String(word || '').toLowerCase();
  return els.find(b => (normText(b).toLowerCase().includes(w)));
}

function getScrollContainer(){
  return document.querySelector('.scaffold-finite-scroll__content, .scaffold-finite-scroll') || document.scrollingElement || document.documentElement || document.body;
}
function scrollToBottom(node){
  if(node===document.body || node===document.documentElement || node===document.scrollingElement){
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } else {
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }
}

function tryClickResumePdf(){
  const moreBtn = document.querySelector('[aria-label^="More" i]') ||
                  document.querySelector('[data-control-name*="profile_more"] button') ||
                  findButtonByIncludes('more');
  const openMenu = () => { if(moreBtn && clickIfVisible(moreBtn)){ banner('Opening menu…'); return true; } return false; };
  const trySelectSavePdf = () => {
    const exact = document.querySelector('div[role="button"][aria-label="Save to PDF"]');
    const fallback = Array.from(document.querySelectorAll('a,button,div[role="button"]')).find(n => normText(n).toLowerCase().includes('save to pdf'));
    const target = exact || fallback;
    if(target && clickIfVisible(target)){ banner('Opening LinkedIn Resume PDF…'); return true; }
    return false;
  };
  const fallbackToPrint = ()=>{ banner('Falling back to Print…'); window.print(); };
  if(!openMenu()) return fallbackToPrint();
  let tries=0; const tick=()=>{ if(trySelectSavePdf()) return; if(++tries>=8) return fallbackToPrint(); setTimeout(tick,200); }; setTimeout(tick,250);
}

function startLoadMore({maxMinutes=1, intervalMs=800}={}){
  const container = getScrollContainer();
  const deadline = Date.now() + maxMinutes*60*1000;
  keepScrolling = true;
  let lastH=0, stable=0;
  banner('Loading more activity…');
  const step=()=>{
    if(!keepScrolling) return;
    scrollToBottom(container);
    const h=(container===window||container===document.body||container===document.documentElement)?document.body.scrollHeight:container.scrollHeight;
    if(h===lastH){ stable++; } else { stable=0; lastH=h; }
    if(Date.now()>deadline || stable>10){ keepScrolling=false; banner('Load more: finished'); return; }
    scrollTimer=setTimeout(step, intervalMs);
  };
  step();
}

function stopScroll(){ keepScrolling=false; if(scrollTimer) clearTimeout(scrollTimer); banner('Stopped'); }

function slugFromProfile(){ try{ const u = new URL(location.href); const path = u.pathname.replace(/\/$/, ''); return path.split('/').slice(-1)[0] || 'profile'; }catch(_){ return 'profile'; } }
function toCsv(rows){ return (rows || []).map(r=>r.map(v => { const s = (v==null?'' : String(v)).split('"').join('""'); return '"' + s + '"'; }).join(',')).join('\n'); }

/* global parsePosts, parseComments */
async function extractPosts(){
  const slug = slugFromProfile();
  const rows = (typeof parsePosts==='function') ? parsePosts() : [];
  banner(`Exporting ${rows.length} posts…`);
  const header = [[ 'profile_slug','captured_at_iso','post_urn','post_url','created_time_iso','text','author_name','author_url','like_count','comment_count','repost_count' ]];
  const stamped = rows.map(r => [slug, new Date().toISOString(), ...r]);
  const csv = toCsv(header.concat(stamped));
  chrome.runtime.sendMessage({type:'DOWNLOAD_CSV', filename:`linkedin_posts_${slug}.csv`, csv});
  banner('Posts CSV downloaded');
}
async function extractComments(){
  const slug = slugFromProfile();
  const rows = (typeof parseComments==='function') ? parseComments() : [];
  banner(`Exporting ${rows.length} comments…`);
  const header = [[ 'profile_slug','captured_at_iso','comment_urn','comment_url','parent_post_urn','parent_post_url','created_time_iso','text','author_name','author_url','like_count' ]];
  const stamped = rows.map(r => [slug, new Date().toISOString(), ...r]);
  const csv = toCsv(header.concat(stamped));
  chrome.runtime.sendMessage({type:'DOWNLOAD_CSV', filename:`linkedin_comments_${slug}.csv`, csv});
  banner('Comments CSV downloaded');
}

async function oneClickAll({maxMinutes=1, intervalMs=800}={}){
  const url = location.href;
  if(url.includes('/in/') && !url.includes('recent-activity')){
    tryClickResumePdf();
    banner('Next: go to Recent Activity → Posts or Comments to download activity.');
  } else if(url.includes('recent-activity')){
    startLoadMore({maxMinutes, intervalMs});
    setTimeout(()=>{ extractPosts(); extractComments(); }, Math.max(1500, intervalMs*5));
  } else {
    banner('Open a LinkedIn profile or Recent Activity page first.');
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if(msg && msg.type === 'PING'){ try{ chrome.runtime.sendMessage({type:'PONG'}); }catch(_){} return true; }
  if(msg && msg.type === 'ONE_CLICK_ALL') oneClickAll(msg.args||{});
  if(msg && msg.type === 'RESUME_PDF') tryClickResumePdf();
  if(msg && msg.type === 'LOAD_MORE_ACTIVITY') startLoadMore(msg.args||{});
  if(msg && msg.type === 'STOP_SCROLL') stopScroll();
  if(msg && msg.type === 'EXTRACT_POSTS') extractPosts();
  if(msg && msg.type === 'EXTRACT_COMMENTS') extractComments();
});

