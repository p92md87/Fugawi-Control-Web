const W=9208,H=6906;
const SHA="bc01c91c709c5ba789ed7ed1196bd431eea795a6f53d6dfe1dff4014793078fe";
const f=document.getElementById("file"),z=document.getElementById("zoom"),m=document.getElementById("map"),s=document.getElementById("status"),e=document.getElementById("export"),v=document.getElementById("viewer");
let x=null,y=null,hash="",url="";
async function sha(buf){const d=await crypto.subtle.digest("SHA-256",buf);return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function size(){if(!m.naturalWidth)return;const k=+z.value;m.style.width=(W*k)+"px";m.style.height=(H*k)+"px"}
f.onchange=async()=>{const q=f.files[0];if(!q)return;const b=await q.arrayBuffer();hash=await sha(b);if(hash!==SHA){s.textContent="Raster no válido";return}url=URL.createObjectURL(q);m.onload=()=>{if(m.naturalWidth!==W||m.naturalHeight!==H){s.textContent="Dimensiones no válidas";return}s.textContent="Raster válido";size();v.scrollLeft=Math.max(0,W*.3*.252-v.clientWidth/2);v.scrollTop=Math.max(0,H*.3*.538-v.clientHeight/2)};m.src=url};
z.oninput=size;
m.onclick=a=>{const r=m.getBoundingClientRect(),k=+z.value;x=(a.clientX-r.left)/k;y=(a.clientY-r.top)/k;s.textContent="RAW X="+x.toFixed(6)+" Y="+y.toFixed(6);e.disabled=false};
e.onclick=()=>{if(x===null)return;const n=new Date().toISOString(),L=[
"FUGAWI_IA_CONTROL_RAW_V043",
"RAW_WEB|VERSION=v043|BUILD=043.0|GENERADO="+n,
"RAW_RASTER|NOMBRE=Barcelona 5_2.jpg|W=9208|H=6906|SHA256="+hash,
"RAW_DOMAIN|DOMINIO=PIXEL_RASTER_ORIGINAL|ORIGEN=SUPERIOR_IZQUIERDO|X=DERECHA|Y=ABAJO|TRANSFORMACIONES_PIXEL=0",
"RAW_CAMPAIGN|ID=BARCELONA_SANT_LLORENC_MONTGAI_RAW9208_V001|OBJETIVO=CUARTO_CONTROL_INDEPENDIENTE_BARCELONA_RAW9208|RASTER_VALIDO=SI",
"RAW_CAMPAIGN_PROGRESS|CONTROLES=1|TOTAL=1|COMPLETA=SI",
"RAW_CONTROL|ID=BC-SLM-001|TIPO=PRESA|NOMBRE=Presa de Sant Llorenc de Montgai|PIX_X="+x+"|PIX_Y="+y+"|DOMINIO=PIXEL_RASTER_ORIGINAL|SELECCION_ORIGEN=manual",
"RAW_RESUMEN|CONTROLES=1|COORDENADAS_OFICIALES=NO_CALCULADAS|MALLA=NO_MODIFICADA"
];const B=new Blob([L.join("\n")+"\n"],{type:"text/plain"}),A=document.createElement("a");A.href=URL.createObjectURL(B);A.download="Fugawi_Barcelona_Presa_Sant_Llorenc_Montgai_RAW_"+n.replace(/[:.]/g,"-")+".txt";A.click()};