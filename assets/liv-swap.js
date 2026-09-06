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
    const direct="/media/liv/"+name;
    try{
      const r=await fetch(direct,{cache:"force-cache"});
      if(r.ok){
        const blob=await r.blob();
        if(blob.size>32){
          cache[name]=URL.createObjectURL(blob);
          return cache[name];
        }
      }
    }catch(e){}
    const urls=parts[name];
    const chunks=await Promise.all(urls.map(u=>fetch(u,{cache:"force-cache"}).then(r=>{
      if(!r.ok) throw new Error(u);
      return r.text();
    })));
    const b64=chunks.join("");
    const mime=name.endsWith(".mp4")?"video/mp4":"image/jpeg";
    cache[name]=toUrl(b64,mime);
    return cache[name];
  }
  function matchName(url){
    if(!url) return null;
    if(url.indexOf("/media/elsa/")===-1 && url.indexOf("/media/liv/")===-1) return null;
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
        try{
          const url=await load(name);
          if(el.src!==url) el.src=url;
        }catch(e){}
      }
    }
    if(tag==="VIDEO"||tag==="IMG"){
      const raw=el.getAttribute("poster")||el.poster||"";
      const name=matchName(raw);
      if(name){
        try{
          const url=await load(name);
          if(el.poster!==url) el.poster=url;
        }catch(e){}
      }
    }
    if(el.getAttribute){
      const alt=el.getAttribute("alt")||"";
      if(alt.indexOf("Elsa Voss")!==-1) el.setAttribute("alt",alt.replaceAll("Elsa Voss","Liv Hale"));
    }
  }
  function patchText(root){
    if(!root) return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while(n=w.nextNode()){
      const v=n.nodeValue;
      if(v&&v.indexOf("Elsa Voss")!==-1) n.nodeValue=v.replaceAll("Elsa Voss","Liv Hale");
    }
  }
  async function scan(){
    document.querySelectorAll("img,video,source").forEach(patchNode);
    patchText(document.body);
  }
  new MutationObserver((muts)=>{
    for(const m of muts){
      if(m.type==="attributes") patchNode(m.target);
      if(m.type==="childList") m.addedNodes.forEach((n)=>{
        if(n.nodeType===1){
          patchNode(n);
          patchText(n);
          if(n.querySelectorAll) n.querySelectorAll("img,video,source").forEach(patchNode);
        }else if(n.nodeType===3){
          if(n.nodeValue&&n.nodeValue.indexOf("Elsa Voss")!==-1)
            n.nodeValue=n.nodeValue.replaceAll("Elsa Voss","Liv Hale");
        }
      });
    }
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","poster","alt"]});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scan);
  else scan();
  setInterval(scan,1200);
})();
