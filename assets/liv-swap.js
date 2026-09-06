(function(){
  const parts={
    "portrait.jpg":["/media/liv/portrait.jpg.b64.1","/media/liv/portrait.jpg.b64.2"],
    "hero.jpg":["/media/liv/hero.jpg.b64"],
    "closeup.jpg":["/media/liv/closeup.jpg.b64"],
    "chalkboard.jpg":["/media/liv/chalkboard.jpg.b64.1","/media/liv/chalkboard.jpg.b64.2"],
    "notes.jpg":["/media/liv/notes.jpg.b64.1","/media/liv/notes.jpg.b64.2"],
    "welcome.mp4":["/media/liv/welcome.mp4.b64.1","/media/liv/welcome.mp4.b64.2"],
    "talking.mp4":["/media/liv/talking.mp4.b64"],
    "teaching.mp4":["/media/liv/teaching.mp4.b64.1","/media/liv/teaching.mp4.b64.2"],
    "notes.mp4":["/media/liv/notes.mp4.b64.1","/media/liv/notes.mp4.b64.2"]
  };
  const cache={};
  function toUrl(b64,mime){
    const clean=b64.replace(/\s+/g,"");
    const bin=atob(clean);
    const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr],{type:mime}));
  }
  async function load(name){
    if(cache[name]) return cache[name];
    const urls=parts[name];
    const chunks=await Promise.all(urls.map(u=>fetch(u,{cache:"force-cache"}).then(r=>r.text())));
    const b64=chunks.join("");
    const mime=name.endsWith(".mp4")?"video/mp4":"image/jpeg";
    cache[name]=toUrl(b64,mime);
    return cache[name];
  }
  function matchName(url){
    if(!url||url.indexOf("/media/elsa/")===-1) return null;
    const path=url.split("?")[0];
    const name=path.slice(path.lastIndexOf("/")+1);
    return parts[name]?name:null;
  }
  async function patchNode(el){
    if(!el||!el.tagName) return;
    const tag=el.tagName;
    if(tag==="IMG"||tag==="SOURCE"||tag==="VIDEO"){
      const raw=el.getAttribute("src")||el.src||"";
      const name=matchName(raw);
      if(name){
        const url=await load(name);
        if(el.src!==url) el.src=url;
      }
    }
    if(tag==="VIDEO"||tag==="IMG"){
      const raw=el.getAttribute("poster")||el.poster||"";
      const name=matchName(raw);
      if(name){
        const url=await load(name);
        if(el.poster!==url) el.poster=url;
      }
    }
  }
  async function scan(){
    document.querySelectorAll("img,video,source").forEach(patchNode);
  }
  new MutationObserver((muts)=>{
    for(const m of muts){
      if(m.type==="attributes") patchNode(m.target);
      if(m.type==="childList") m.addedNodes.forEach((n)=>{
        if(n.nodeType===1){
          patchNode(n);
          if(n.querySelectorAll) n.querySelectorAll("img,video,source").forEach(patchNode);
        }
      });
    }
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","poster"]});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scan);
  else scan();
  setInterval(scan,1200);
})();
