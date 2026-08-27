import type { Project } from './project';

export function safeFilename(title: string): string {
  return (title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'songsketch').slice(0, 50);
}

export function download(data: BlobPart, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createShareHtml(project: Project): string {
  const json = JSON.stringify(project).replace(/</g, '\\u003c');
  const title = project.title.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} — SongSketch</title><style>body{margin:0;background:#090b16;color:#f5f2da;font:18px system-ui;display:grid;min-height:100vh;place-items:center}main{max-width:34rem;padding:2rem;text-align:center}button{font:inherit;font-weight:800;background:#c8f85b;color:#090b16;border:0;padding:1rem 2rem;box-shadow:4px 4px #65e7f1;cursor:pointer}.meta{color:#b7bdd3}canvas{width:100%;height:120px;background:#11162a;margin:1.5rem 0;image-rendering:pixelated}</style><main><p>SONGSKETCH SIGNAL</p><h1>${title}</h1><p class="meta">${project.bars} bars · ${project.tempo} BPM · plays locally</p><canvas width="640" height="120" aria-label="Melody preview"></canvas><button>Play loop</button><p class="meta">Shared as one self-contained file. No upload needed.</p></main><script>const p=${json},b=document.querySelector('button'),c=document.querySelector('canvas'),x=c.getContext('2d');x.fillStyle='#1b2440';x.fillRect(0,0,640,120);p.notes.forEach(n=>{x.fillStyle='#c8f85b';x.fillRect(n.start/(p.bars*16)*640,(83-n.pitch)/36*120,Math.max(2,n.length/(p.bars*16)*640),4)});let ctx,timer,nodes=[];function stop(){clearInterval(timer);nodes.forEach(n=>{try{n.stop()}catch{}});nodes=[];b.textContent='Play loop'}function play(){ctx=ctx||new AudioContext;let step=0,next=ctx.currentTime+.05,d=60/p.tempo/4;b.textContent='Stop';timer=setInterval(()=>{while(next<ctx.currentTime+.12){p.notes.filter(n=>n.start===step).forEach(n=>{let o=ctx.createOscillator(),g=ctx.createGain();o.type=p.wave;o.frequency.value=440*2**((n.pitch-69)/12);g.gain.setValueAtTime(.0001,next);g.gain.exponentialRampToValueAtTime(.16,next+.02);g.gain.exponentialRampToValueAtTime(.0001,next+n.length*d*.98);o.connect(g).connect(ctx.destination);o.start(next);o.stop(next+n.length*d);nodes.push(o)});next+=d;step=(step+1)%(p.bars*16)}},25)}b.onclick=()=>b.textContent==='Stop'?stop():play();</script></html>`;
}
