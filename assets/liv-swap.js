(function(){
  const files={
    "portrait.jpg":"/media/liv/portrait.b64",
    "hero.jpg":"/media/liv/hero.b64",
    "closeup.jpg":"/media/liv/closeup.b64",
    "chalkboard.jpg":"/media/liv/chalkboard.b64",
    "notes.jpg":"/media/liv/notes.b64",
    "welcome.mp4":"/media/liv/welcome.mp4.b64",
    "talking.mp4":"/media/liv/talking.mp4.b64",
    "teaching.mp4":"/media/liv/teaching.mp4.b64",
    "notes.mp4":"/media/liv/notes.mp4.b64"
  };
  const cache={};
  function decode(b64,mime){
    const clean=b64.replace(/\s+/g,"");
    const bin=atob(clean);
    const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr],{type:mime}));
  }
  async function load(name){
    if(cache[name]) return cache[name];
    const res=await fetch(files[name],{cache:"force-cache"});
    const b64=await res.text();
    const mime=name.endsWith(".mp4")?"video/mp4":"image/jpeg";
    cache[name]=decode(b64,mime);
    return cache[name];
  }
  function matchName(url){
    if(!url||url.indexOf("/media/elsa/")===-1) return null;
    const path=url.split("?")[0];
    const name=path.slice(path.lastIndexOf("/")+1);
    return files[name]?name:null;
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
    const nodes=document.querySelectorAll("img,video,source");
    for(const el of nodes) await patchNode(el);
  }
  const mo=new MutationObserver((muts)=>{
    for(const m of muts){
      if(m.type==="attributes") patchNode(m.target);
      if(m.type==="childList"){
        m.addedNodes.forEach((n)=>{
          if(n.nodeType===1){
            patchNode(n);
            if(n.querySelectorAll) n.querySelectorAll("img,video,source").forEach(patchNode);
          }
        });
      }
    }
  });
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","poster"]});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scan);
  else scan();
  setInterval(scan,1200);
})();
