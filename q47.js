(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const VERSION = "v008";
  const BUILD = "008.0";
  const BASE = "P3N_042";
  const REF_W = 18316;
  const REF_H = 13828;
  const INPUT_REF_W = 18315;
  const INPUT_REF_H = 13827;
  const FRAC_U = 0.441195799;
  const FRAC_V = 0.701011619;
  const STORAGE_ZONES = "fugawiQ47ExclusionZonesV008";
  const STORAGE_CONTROLS = "fugawiQ47ControlsV008";
  const CROP_PADDING = 180;

  const I1 = {id:65,x:9105.78,y:5259.32,lat:41.0748,lon:-5.38198};
  const I2 = {id:66,x:10283.9,y:5231.68,lat:41.0772,lon:-5.26304};
  const I3 = {id:78,x:10254.1,y:4045.2,lat:41.1672,lon:-5.26613};
  const I4 = {id:77,x:9070,y:4074.84,lat:41.1648,lon:-5.38524};
  const C = {
    id:"C",
    x:9601.197356,
    y:4441.385330,
    lat:41.138959560314,
    lon:-5.331734591888
  };

  const Q47_REGRESSION_02 = {
    id:"TEST_Q47_02",
    x:9893.92,
    y:4693.69,
    lat:41.118667361632,
    lon:-5.302340503458
  };
  const CERT_LA_CAROLINA = {
    id:"VG_LA_CAROLINA_45367",
    x:9893.92,
    y:4693.69,
    e:307003.229,
    n:4554487.232
  };

  function lerpPoint(a,b,t,id) {
    return {
      id:id,
      x:a.x+t*(b.x-a.x),
      y:a.y+t*(b.y-a.y),
      lat:a.lat+t*(b.lat-a.lat),
      lon:a.lon+t*(b.lon-a.lon)
    };
  }

  const S = lerpPoint(I1,I2,FRAC_U,"S");
  const E = lerpPoint(I2,I3,FRAC_V,"E");
  const N = lerpPoint(I4,I3,FRAC_U,"N");
  const W = lerpPoint(I1,I4,FRAC_V,"W");
  const SUBQUADS = [
    [I1,S,C,W],
    [S,I2,E,C],
    [C,E,I3,N],
    [W,C,N,I4]
  ];
  const Q47 = [I1,I2,I3,I4];

  const modelCrop = {
    x1:Math.min(...Q47.map(p=>p.x))-CROP_PADDING,
    y1:Math.min(...Q47.map(p=>p.y))-CROP_PADDING,
    x2:Math.max(...Q47.map(p=>p.x))+CROP_PADDING,
    y2:Math.max(...Q47.map(p=>p.y))+CROP_PADDING
  };

  const state = {
    file:null,
    fileName:"",
    sourceW:0,
    sourceH:0,
    sourceCrop:null,
    bitmap:null,
    image:null,
    objectUrl:"",
    selected:null,
    zones:loadJson(STORAGE_ZONES,[]),
    controls:loadJson(STORAGE_CONTROLS,[]),
    inheritedControls:0,
    rejections:[],
    zoneDraft:null,
    mode:"control",
    sessionStartedAt:new Date().toISOString()
  };

  state.inheritedControls=state.controls.length;

  function loadJson(key,fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_ZONES,JSON.stringify(state.zones));
    localStorage.setItem(STORAGE_CONTROLS,JSON.stringify(state.controls));
  }

  function clamp(v,min,max) {
    return Math.max(min,Math.min(max,v));
  }

  function n(v,d=3) {
    return Number.isFinite(v) ? Number(v).toFixed(d) : "—";
  }

  function safeName(text) {
    return String(text || "control")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9_-]+/g,"_")
      .replace(/^_+|_+$/g,"") || "control";
  }

  function bilinear(q,u,v,key) {
    return (1-u)*(1-v)*q[0][key]+
      u*(1-v)*q[1][key]+
      u*v*q[2][key]+
      (1-u)*v*q[3][key];
  }

  function solveSubquad(q,px,py) {
    let u=0.5;
    let v=0.5;
    for (let iter=0;iter<15;iter+=1) {
      const bx=bilinear(q,u,v,"x");
      const by=bilinear(q,u,v,"y");
      const fx=bx-px;
      const fy=by-py;
      if (Math.abs(fx)<0.000001 && Math.abs(fy)<0.000001) break;

      const dxdu=-(1-v)*q[0].x+(1-v)*q[1].x+v*q[2].x-v*q[3].x;
      const dxdv=-(1-u)*q[0].x-u*q[1].x+u*q[2].x+(1-u)*q[3].x;
      const dydu=-(1-v)*q[0].y+(1-v)*q[1].y+v*q[2].y-v*q[3].y;
      const dydv=-(1-u)*q[0].y-u*q[1].y+u*q[2].y+(1-u)*q[3].y;
      const det=dxdu*dydv-dxdv*dydu;
      if (Math.abs(det)<0.0000001) return null;

      const du=(-fx*dydv+dxdv*fy)/det;
      const dv=(-dxdu*fy+fx*dydu)/det;
      u+=du;
      v+=dv;
    }

    if (u<-0.01 || u>1.01 || v<-0.01 || v>1.01) return null;
    u=clamp(u,0,1);
    v=clamp(v,0,1);

    return {
      u:u,
      v:v,
      lat:bilinear(q,u,v,"lat"),
      lon:bilinear(q,u,v,"lon")
    };
  }

  function solveQ47Pixel(px,py) {
    for (let i=0;i<SUBQUADS.length;i+=1) {
      const solved=solveSubquad(SUBQUADS[i],px,py);
      if (solved) {
        solved.subquad=i+1;
        solved.rawX=px;
        solved.rawY=py;
        const utm=latLonToUtm30(solved.lat,solved.lon);
        solved.e=utm.e;
        solved.n=utm.n;
        return solved;
      }
    }
    return null;
  }

  function latLonToUtm30(latDeg,lonDeg) {
    const a=6378137;
    const f=1/298.257222101;
    const k0=0.9996;
    const e2=f*(2-f);
    const ep2=e2/(1-e2);
    const lat=latDeg*Math.PI/180;
    const lon=lonDeg*Math.PI/180;
    const lon0=-3*Math.PI/180;
    const sin=Math.sin(lat);
    const cos=Math.cos(lat);
    const tan=Math.tan(lat);
    const nu=a/Math.sqrt(1-e2*sin*sin);
    const t=tan*tan;
    const c=ep2*cos*cos;
    const A=cos*(lon-lon0);
    const e4=e2*e2;
    const e6=e4*e2;
    const M=a*(
      (1-e2/4-3*e4/64-5*e6/256)*lat
      -(3*e2/8+3*e4/32+45*e6/1024)*Math.sin(2*lat)
      +(15*e4/256+45*e6/1024)*Math.sin(4*lat)
      -(35*e6/3072)*Math.sin(6*lat)
    );
    const easting=500000+k0*nu*(
      A+(1-t+c)*Math.pow(A,3)/6+
      (5-18*t+t*t+72*c-58*ep2)*Math.pow(A,5)/120
    );
    const northing=k0*(
      M+nu*tan*(
        A*A/2+
        (5-t+9*c+4*c*c)*Math.pow(A,4)/24+
        (61-58*t+t*t+600*c-330*ep2)*Math.pow(A,6)/720
      )
    );
    return {e:easting,n:northing};
  }

  function certifiedDiagnostic() {
    const solved=solveQ47Pixel(
      CERT_LA_CAROLINA.x,
      CERT_LA_CAROLINA.y
    );
    if (!solved) return null;
    const de=solved.e-CERT_LA_CAROLINA.e;
    const dn=solved.n-CERT_LA_CAROLINA.n;
    return {
      solved:solved,
      de:de,
      dn:dn,
      residual:Math.hypot(de,dn)
    };
  }

  function regressionReferenceDiagnostic() {
    const utm=latLonToUtm30(
      Q47_REGRESSION_02.lat,
      Q47_REGRESSION_02.lon
    );
    const de=utm.e-CERT_LA_CAROLINA.e;
    const dn=utm.n-CERT_LA_CAROLINA.n;
    return {
      e:utm.e,
      n:utm.n,
      de:de,
      dn:dn,
      residual:Math.hypot(de,dn)
    };
  }

  function updateCertifiedPanel() {
    const d=certifiedDiagnostic();
    if (!d) {
      $("q47CertResidual").textContent="SIN SOLUCIÓN";
      $("q47CertDeltaE").textContent="—";
      $("q47CertDeltaN").textContent="—";
      return;
    }
    $("q47CertResidual").textContent=n(d.residual,2)+" m";
    $("q47CertDeltaE").textContent=n(d.de,2)+" m";
    $("q47CertDeltaN").textContent=n(d.dn,2)+" m";
    if (!state.selected) {
      $("q47TapVsCert").textContent=
        "Toca el mapa para comparar tu selección con este control.";
      return;
    }
    const dx=state.selected.rawX-CERT_LA_CAROLINA.x;
    const dy=state.selected.rawY-CERT_LA_CAROLINA.y;
    const dp=Math.hypot(dx,dy);
    let modelM=null;
    if (!state.selected.rejected) {
      modelM=Math.hypot(
        state.selected.e-d.solved.e,
        state.selected.n-d.solved.n
      );
    }
    $("q47TapVsCert").textContent=
      "Selección vs certificado: ΔX "+n(dx,2)+
      " px · ΔY "+n(dy,2)+
      " px · distancia "+n(dp,2)+" px"+
      (modelM===null ? "" : " · ≈ "+n(modelM,1)+" m Q47");
  }

  function haversine(lat1,lon1,lat2,lon2) {
    const r=6371008.8;
    const p1=lat1*Math.PI/180;
    const p2=lat2*Math.PI/180;
    const dp=(lat2-lat1)*Math.PI/180;
    const dl=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dp/2)**2+
      Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }

  function pointInPolygon(x,y,poly) {
    let inside=false;
    for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
      const xi=poly[i].x;
      const yi=poly[i].y;
      const xj=poly[j].x;
      const yj=poly[j].y;
      const hit=((yi>y)!=(yj>y)) &&
        (x<(xj-xi)*(y-yi)/(yj-yi)+xi);
      if (hit) inside=!inside;
    }
    return inside;
  }

  function nearestQ47Boundary(x,y) {
    const sides=["SUR","ESTE","NORTE","OESTE"];
    let best=null;
    for (let i=0;i<Q47.length;i+=1) {
      const a=Q47[i];
      const b=Q47[(i+1)%Q47.length];
      const vx=b.x-a.x;
      const vy=b.y-a.y;
      const len2=vx*vx+vy*vy;
      let t=((x-a.x)*vx+(y-a.y)*vy)/len2;
      t=clamp(t,0,1);
      const nx=a.x+t*vx;
      const ny=a.y+t*vy;
      const d=Math.hypot(x-nx,y-ny);
      if (!best || d<best.distancePx) {
        best={
          side:sides[i],
          distancePx:d,
          nearestX:nx,
          nearestY:ny
        };
      }
    }
    return best;
  }

  function exclusionAt(x,y) {
    return state.zones.find(z=>
      x>=Math.min(z.x1,z.x2) &&
      x<=Math.max(z.x1,z.x2) &&
      y>=Math.min(z.y1,z.y2) &&
      y<=Math.max(z.y1,z.y2)
    ) || null;
  }

  async function inspectRasterHeader(file) {
    const info={
      isPng:false,
      w:null,
      h:null,
      hex:"",
      mime:file.type || ""
    };
    try {
      const buf=await file.slice(0,32).arrayBuffer();
      const b=new Uint8Array(buf);
      info.hex=Array.from(b.slice(0,12))
        .map(v=>v.toString(16).padStart(2,"0"))
        .join(" ");
      const sig=[137,80,78,71,13,10,26,10];
      info.isPng=b.length>=24 && sig.every((v,i)=>b[i]===v);
      if (info.isPng) {
        const view=new DataView(buf);
        info.w=view.getUint32(16,false);
        info.h=view.getUint32(20,false);
      }
    } catch (_) {}
    return info;
  }

  function decodeRasterImage(file) {
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{
        const w=img.naturalWidth || img.width;
        const h=img.naturalHeight || img.height;
        if (!w || !h) {
          URL.revokeObjectURL(url);
          reject(new Error("El navegador no ha podido obtener las dimensiones del raster."));
          return;
        }
        resolve({img:img,url:url,w:w,h:h});
      };
      img.onerror=()=>{
        URL.revokeObjectURL(url);
        reject(new Error("El navegador no puede decodificar el archivo seleccionado como imagen."));
      };
      img.src=url;
    });
  }

  function sourceRect(sourceW,sourceH) {
    const sx1=clamp(modelCrop.x1*sourceW/REF_W,0,sourceW);
    const sy1=clamp(modelCrop.y1*sourceH/REF_H,0,sourceH);
    const sx2=clamp(modelCrop.x2*sourceW/REF_W,0,sourceW);
    const sy2=clamp(modelCrop.y2*sourceH/REF_H,0,sourceH);
    return {
      sx:Math.floor(sx1),
      sy:Math.floor(sy1),
      sw:Math.max(1,Math.ceil(sx2-sx1)),
      sh:Math.max(1,Math.ceil(sy2-sy1))
    };
  }

  async function loadRaster(file) {
    setMessage("Abriendo raster y preparando recorte Q47…","working");
    clearRaster();

    state.file=file;
    state.fileName=file.name;

    const header=await inspectRasterHeader(file);
    let size=null;
    let decoded=null;

    if (header.isPng && header.w && header.h) {
      size={w:header.w,h:header.h};
    } else {
      decoded=await decodeRasterImage(file);
      size={w:decoded.w,h:decoded.h};
    }

    state.sourceW=size.w;
    state.sourceH=size.h;
    state.sourceCrop=sourceRect(size.w,size.h);

    if ("createImageBitmap" in window) {
      try {
        const r=state.sourceCrop;
        state.bitmap=await createImageBitmap(file,r.sx,r.sy,r.sw,r.sh);
      } catch (_) {
        state.bitmap=null;
      }
    }

    if (state.bitmap) {
      if (decoded) {
        decoded.img.src="";
        URL.revokeObjectURL(decoded.url);
      }
    } else if (decoded) {
      state.image=decoded.img;
      state.objectUrl=decoded.url;
    } else {
      decoded=await decodeRasterImage(file);
      state.image=decoded.img;
      state.objectUrl=decoded.url;
    }

    fitCanvas();
    redraw();

    const exactInput=size.w===INPUT_REF_W && size.h===INPUT_REF_H;
    const exactGeometry=size.w===REF_W && size.h===REF_H;
    const formatText=header.isPng ?
      "PNG verificado" :
      "imagen decodificada por el navegador";
    const sizeText=file.size ?
      " · "+(file.size/1048576).toFixed(1)+" MB" :
      "";

    $("q47RasterMeta").textContent=
      file.name+" · "+size.w+" × "+size.h+" px"+sizeText+
      " · "+formatText+" · recorte Q47 local";

    if (exactInput) {
      setMessage(
        "Raster 18315 × 13827 reconocido. La Web lo convierte al espacio geométrico P3N 18316 × 13828. Toca sólo dentro de Q47, en la zona no oscurecida.",
        "ok"
      );
    } else if (exactGeometry) {
      setMessage(
        "Raster 18316 × 13828 reconocido directamente en el espacio geométrico P3N. Toca sólo dentro de Q47, en la zona no oscurecida.",
        "ok"
      );
    } else {
      setMessage(
        "Raster cargado con dimensiones "+size.w+" × "+size.h+
        " px. Se convertirá proporcionalmente al espacio P3N "+
        REF_W+" × "+REF_H+
        "; verifica visualmente la alineación antes de registrar controles.",
        "working"
      );
    }
    $("q47MapHint").classList.add("hidden");
  }

  function clearRaster() {
    if (state.bitmap && state.bitmap.close) state.bitmap.close();
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.bitmap=null;
    state.image=null;
    state.objectUrl="";
    state.selected=null;
  }

  function fitCanvas() {
    const canvas=$("q47Canvas");
    const r=state.sourceCrop;
    if (!r) return;
    const maxSide=1500;
    const scale=Math.min(1,maxSide/Math.max(r.sw,r.sh));
    canvas.width=Math.max(720,Math.round(r.sw*scale));
    canvas.height=Math.max(720,Math.round(r.sh*scale));
  }

  function rawToCanvas(x,y) {
    const r=state.sourceCrop;
    const canvas=$("q47Canvas");
    const sx=x*state.sourceW/REF_W;
    const sy=y*state.sourceH/REF_H;
    return {
      x:(sx-r.sx)/r.sw*canvas.width,
      y:(sy-r.sy)/r.sh*canvas.height
    };
  }

  function canvasEventToRaw(event) {
    const canvas=$("q47Canvas");
    const rect=canvas.getBoundingClientRect();
    const cx=(event.clientX-rect.left)*canvas.width/rect.width;
    const cy=(event.clientY-rect.top)*canvas.height/rect.height;
    const r=state.sourceCrop;
    const sx=r.sx+cx/canvas.width*r.sw;
    const sy=r.sy+cy/canvas.height*r.sh;
    return {
      x:sx*REF_W/state.sourceW,
      y:sy*REF_H/state.sourceH
    };
  }

  function drawPath(ctx,points,close=true) {
    const first=rawToCanvas(points[0].x,points[0].y);
    ctx.beginPath();
    ctx.moveTo(first.x,first.y);
    for (let i=1;i<points.length;i+=1) {
      const p=rawToCanvas(points[i].x,points[i].y);
      ctx.lineTo(p.x,p.y);
    }
    if (close) ctx.closePath();
  }

  function shadeOutsideQ47(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0,0,$("q47Canvas").width,$("q47Canvas").height);
    const first=rawToCanvas(Q47[0].x,Q47[0].y);
    ctx.moveTo(first.x,first.y);
    for (let i=1;i<Q47.length;i+=1) {
      const p=rawToCanvas(Q47[i].x,Q47[i].y);
      ctx.lineTo(p.x,p.y);
    }
    ctx.closePath();
    ctx.fillStyle="rgba(5,11,19,.62)";
    ctx.fill("evenodd");
    ctx.restore();
  }

  function redraw() {
    updateCertifiedPanel();
    const canvas=$("q47Canvas");
    if (!canvas || !state.sourceCrop) return;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (state.bitmap) {
      ctx.drawImage(state.bitmap,0,0,canvas.width,canvas.height);
    } else if (state.image) {
      const r=state.sourceCrop;
      ctx.drawImage(
        state.image,r.sx,r.sy,r.sw,r.sh,
        0,0,canvas.width,canvas.height
      );
    }

    shadeOutsideQ47(ctx);

    ctx.save();
    ctx.lineJoin="round";
    ctx.lineCap="round";

    SUBQUADS.forEach((q,i)=>{
      drawPath(ctx,q);
      ctx.fillStyle=i%2===0 ? "rgba(72,151,255,.08)" : "rgba(97,214,156,.07)";
      ctx.fill();
      ctx.strokeStyle="rgba(133,186,255,.95)";
      ctx.lineWidth=2;
      ctx.stroke();

      const mx=q.reduce((a,p)=>a+p.x,0)/4;
      const my=q.reduce((a,p)=>a+p.y,0)/4;
      const c=rawToCanvas(mx,my);
      ctx.fillStyle="rgba(7,17,31,.78)";
      ctx.fillRect(c.x-34,c.y-15,68,30);
      ctx.fillStyle="#f3f7ff";
      ctx.font="700 18px system-ui";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText("Q47."+(i+1),c.x,c.y);
    });

    drawPath(ctx,Q47);
    ctx.strokeStyle="#f0bd62";
    ctx.lineWidth=4;
    ctx.stroke();

    state.zones.forEach(z=>{
      const a=rawToCanvas(Math.min(z.x1,z.x2),Math.min(z.y1,z.y2));
      const b=rawToCanvas(Math.max(z.x1,z.x2),Math.max(z.y1,z.y2));
      ctx.fillStyle="rgba(255,80,95,.20)";
      ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);
      ctx.strokeStyle="rgba(255,143,154,.95)";
      ctx.lineWidth=2;
      ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    });

    if (state.zoneDraft) {
      const p=rawToCanvas(state.zoneDraft.x,state.zoneDraft.y);
      ctx.strokeStyle="#ff8f9a";
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(p.x-15,p.y);
      ctx.lineTo(p.x+15,p.y);
      ctx.moveTo(p.x,p.y-15);
      ctx.lineTo(p.x,p.y+15);
      ctx.stroke();
    }

    const labels=[
      {p:I1,t:"65"},
      {p:I2,t:"66"},
      {p:I3,t:"78"},
      {p:I4,t:"77"},
      {p:C,t:"C"}
    ];
    labels.forEach(item=>{
      const p=rawToCanvas(item.p.x,item.p.y);
      ctx.fillStyle=item.t==="C" ? "#61d69c" : "#f0bd62";
      ctx.beginPath();
      ctx.arc(p.x,p.y,item.t==="C" ? 7 : 6,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#07111f";
      ctx.font="800 13px system-ui";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      if (item.t==="C") {
        ctx.fillStyle="#eafff4";
        ctx.font="800 14px system-ui";
        ctx.fillText("C",p.x+15,p.y-14);
      }
    });

    const certP=rawToCanvas(
      CERT_LA_CAROLINA.x,
      CERT_LA_CAROLINA.y
    );
    ctx.save();
    ctx.strokeStyle="#d8a7ff";
    ctx.fillStyle="rgba(216,167,255,.18)";
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(certP.x,certP.y-11);
    ctx.lineTo(certP.x+11,certP.y);
    ctx.lineTo(certP.x,certP.y+11);
    ctx.lineTo(certP.x-11,certP.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle="#f3e4ff";
    ctx.font="800 12px system-ui";
    ctx.textAlign="left";
    ctx.textBaseline="middle";
    ctx.fillText("LC 45367",certP.x+15,certP.y-14);
    ctx.restore();

    if (state.selected) {
      const p=rawToCanvas(state.selected.rawX,state.selected.rawY);
      ctx.strokeStyle=state.selected.rejected ? "#ff8f9a" : "#ffffff";
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(p.x,p.y,12,0,Math.PI*2);
      ctx.moveTo(p.x-20,p.y);
      ctx.lineTo(p.x+20,p.y);
      ctx.moveTo(p.x,p.y-20);
      ctx.lineTo(p.x,p.y+20);
      ctx.stroke();
    }

    ctx.restore();
  }

  function setMessage(text,type="") {
    const node=$("q47Message");
    node.textContent=text;
    node.className="q47-message"+(type ? " "+type : "");
  }

  function resetResultFields() {
    [
      "q47RawX","q47RawY","q47Subquad","q47UV",
      "q47Lat","q47Lon","q47CalcE","q47CalcN","q47Residual"
    ].forEach(id=>$(id).textContent="—");
  }

  function clearControlInputs() {
    ["q47ControlName","q47RefE","q47RefN","q47RefLat","q47RefLon"]
      .forEach(id=>$(id).value="");
    $("q47ReferenceState").textContent="PENDIENTE · IGN/PNOA";
  }

  function newQ47Test() {
    const ok=confirm(
      "¿Iniciar una nueva prueba Q47? Se borrarán controles, rechazos y selección. El raster cargado y las zonas excluidas se conservarán."
    );
    if (!ok) return;

    state.controls=[];
    state.rejections=[];
    state.selected=null;
    state.zoneDraft=null;
    state.mode="control";
    state.sessionStartedAt=new Date().toISOString();
    state.inheritedControls=0;
    $("q47AddExclusionBtn").classList.remove("active");
    localStorage.removeItem(STORAGE_CONTROLS);
    saveLocal();
    resetResultFields();
    clearControlInputs();
    renderControls();
    redraw();
    setMessage(
      "Nueva prueba Q47 iniciada. No hay controles heredados de la prueba anterior.",
      "ok"
    );
  }

  function selectControl(rawX,rawY) {
    resetResultFields();

    if (!pointInPolygon(rawX,rawY,Q47)) {
      const near=nearestQ47Boundary(rawX,rawY);
      state.selected={
        rawX:rawX,
        rawY:rawY,
        rejected:true,
        reason:"FUERA_Q47",
        nearestSide:near.side,
        distancePx:near.distancePx
      };
      state.rejections.push({
        at:new Date().toISOString(),
        rawX:rawX,
        rawY:rawY,
        reason:"FUERA_Q47",
        nearestSide:near.side,
        distancePx:near.distancePx,
        nearestX:near.nearestX,
        nearestY:near.nearestY
      });
      setMessage(
        "Control rechazado: está fuera de Q47, a "+
        n(near.distancePx,1)+" px del borde "+near.side+
        ". La zona oscurecida es sólo contexto.",
        "error"
      );
      redraw();
      return;
    }

    const zone=exclusionAt(rawX,rawY);
    if (zone) {
      state.selected={
        rawX:rawX,
        rawY:rawY,
        rejected:true,
        reason:"ZONA_EXCLUIDA",
        zoneId:zone.id
      };
      state.rejections.push({
        at:new Date().toISOString(),
        rawX:rawX,
        rawY:rawY,
        reason:"ZONA_EXCLUIDA",
        zoneId:zone.id
      });
      setMessage("Control rechazado automáticamente: cae dentro de la zona excluida "+zone.id+".","error");
      redraw();
      return;
    }

    const solved=solveQ47Pixel(rawX,rawY);
    if (!solved) {
      state.selected={rawX:rawX,rawY:rawY,rejected:true,reason:"SIN_SOLUCION_Q47"};
      state.rejections.push({
        at:new Date().toISOString(),
        rawX:rawX,
        rawY:rawY,
        reason:"SIN_SOLUCION_Q47"
      });
      setMessage("Control rechazado: la submalla no obtiene una solución bilineal válida.","error");
      redraw();
      return;
    }

    solved.rejected=false;
    state.selected=solved;
    $("q47RawX").textContent=n(rawX,3);
    $("q47RawY").textContent=n(rawY,3);
    $("q47Subquad").textContent="Q47."+solved.subquad;
    $("q47UV").textContent=n(solved.u,6)+" / "+n(solved.v,6);
    $("q47Lat").textContent=n(solved.lat,9);
    $("q47Lon").textContent=n(solved.lon,9);
    $("q47CalcE").textContent=n(solved.e,3);
    $("q47CalcN").textContent=n(solved.n,3);
    updateResidualPreview();
    $("q47ReferenceState").textContent="PENDIENTE · IGN/PNOA";
    setMessage("Punto válido en Q47."+solved.subquad+". Identifica el objeto y regístralo; no necesitas conocer sus coordenadas oficiales.","ok");
    redraw();
  }

  function readNumber(id) {
    const text=$(id).value.trim().replace(",",".");
    if (!text) return null;
    const value=Number(text);
    return Number.isFinite(value) ? value : null;
  }

  function residualForSelection() {
    if (!state.selected || state.selected.rejected) return null;
    const refE=readNumber("q47RefE");
    const refN=readNumber("q47RefN");
    if (refE===null || refN===null) return null;
    const de=state.selected.e-refE;
    const dn=state.selected.n-refN;
    return {
      refE:refE,
      refN:refN,
      de:de,
      dn:dn,
      mag:Math.hypot(de,dn)
    };
  }

  function updateResidualPreview() {
    const r=residualForSelection();
    if (!state.selected || state.selected.rejected) {
      $("q47Residual").textContent="—";
      return;
    }

    const refLat=readNumber("q47RefLat");
    const refLon=readNumber("q47RefLon");
    const geoOk=refLat!==null && refLon!==null;
    const geo=geoOk ?
      haversine(state.selected.lat,state.selected.lon,refLat,refLon) :
      null;

    if (geo!==null && r) {
      $("q47Residual").textContent=
        n(geo,3)+" m Haversine · UTM "+n(r.mag,3)+" m";
      return;
    }
    if (geo!==null) {
      $("q47Residual").textContent=n(geo,3)+" m Haversine";
      return;
    }
    if (r) {
      $("q47Residual").textContent=
        n(r.mag,3)+" m UTM · ΔE "+n(r.de,3)+" · ΔN "+n(r.dn,3);
      return;
    }
    $("q47Residual").textContent="Introduce referencia IGN";
  }

  function registerControl() {
    if (!state.selected || state.selected.rejected) {
      setMessage("No hay un punto Q47 válido para registrar.","error");
      return;
    }
    const name=$("q47ControlName").value.trim();
    if (!name) {
      setMessage("Describe brevemente el objeto físico que has tocado.","error");
      $("q47ControlName").focus();
      return;
    }

    const residual=residualForSelection();
    const refLat=readNumber("q47RefLat");
    const refLon=readNumber("q47RefLon");
    const geoResidual=
      refLat!==null && refLon!==null ?
      haversine(state.selected.lat,state.selected.lon,refLat,refLon) :
      null;
    const hasIndependent=Boolean(residual || geoResidual!==null);

    let deltaE=null;
    let deltaN=null;
    let residualUtmM=null;
    if (residual) {
      deltaE=residual.de;
      deltaN=residual.dn;
      residualUtmM=residual.mag;
    }

    const primaryResidual=geoResidual!==null ?
      geoResidual : residualUtmM;
    const residualMethod=geoResidual!==null ?
      "HAVERSINE_LATLON" :
      (residual ? "ETRS89_UTM30" : "PENDIENTE");
    const status=hasIndependent ?
      "REFERENCIA_INDEPENDIENTE_INFORMADA" :
      "PENDIENTE_REFERENCIA_IGN_PNOA";

    const control={
      at:new Date().toISOString(),
      name:name,
      raster:state.fileName,
      rawX:state.selected.rawX,
      rawY:state.selected.rawY,
      subquad:state.selected.subquad,
      u:state.selected.u,
      v:state.selected.v,
      lat:state.selected.lat,
      lon:state.selected.lon,
      calcE:state.selected.e,
      calcN:state.selected.n,
      refE:residual ? residual.refE : null,
      refN:residual ? residual.refN : null,
      refLat:refLat,
      refLon:refLon,
      deltaE:deltaE,
      deltaN:deltaN,
      residualUtmM:residualUtmM,
      residualGeoM:geoResidual,
      residualM:primaryResidual,
      residualMethod:residualMethod,
      status:status
    };
    state.controls.unshift(control);
    saveLocal();
    renderControls();
    $("q47ReferenceState").textContent=hasIndependent ?
      "INFORMADA · pendiente de certificación" :
      "PENDIENTE · IGN/PNOA";
    setMessage(
      hasIndependent ?
      "Control registrado con referencia informada; aún requiere comprobar que la fuente sea independiente y oficial." :
      "Candidato Q47 registrado. Queda PENDIENTE hasta identificar el mismo objeto en IGN/PNOA.",
      hasIndependent ? "working" : "ok"
    );
  }

  function startExclusion() {
    if (!state.sourceCrop) {
      setMessage("Carga primero el raster de Salamanca.","error");
      return;
    }
    state.mode="exclusion";
    state.zoneDraft=null;
    $("q47AddExclusionBtn").classList.add("active");
    setMessage("Zona excluida: toca dos esquinas opuestas del rectángulo que quieres bloquear.","working");
  }

  function handleExclusionTap(raw) {
    if (!pointInPolygon(raw.x,raw.y,Q47)) {
      setMessage("La esquina de exclusión debe quedar dentro de Q47.","error");
      return;
    }
    if (!state.zoneDraft) {
      state.zoneDraft=raw;
      setMessage("Primera esquina fijada. Toca la esquina opuesta.","working");
      redraw();
      return;
    }
    const id="EX"+String(state.zones.length+1).padStart(2,"0");
    state.zones.push({
      id:id,
      x1:state.zoneDraft.x,
      y1:state.zoneDraft.y,
      x2:raw.x,
      y2:raw.y
    });
    state.zoneDraft=null;
    state.mode="control";
    $("q47AddExclusionBtn").classList.remove("active");
    saveLocal();
    renderZones();
    redraw();
    setMessage("Zona "+id+" activada. Los controles dentro de ella serán rechazados automáticamente.","ok");
  }

  function undoZone() {
    state.zoneDraft=null;
    if (state.zones.length) state.zones.pop();
    state.mode="control";
    $("q47AddExclusionBtn").classList.remove("active");
    saveLocal();
    renderZones();
    redraw();
    setMessage("Última zona de exclusión retirada.","ok");
  }

  function clearZones() {
    if (!state.zones.length) return;
    if (!confirm("¿Eliminar todas las zonas de exclusión Q47 guardadas en este iPad?")) return;
    state.zones=[];
    state.zoneDraft=null;
    state.mode="control";
    $("q47AddExclusionBtn").classList.remove("active");
    saveLocal();
    renderZones();
    redraw();
    setMessage("Zonas de exclusión eliminadas.","ok");
  }

  function renderZones() {
    const node=$("q47ZoneList");
    node.innerHTML="";
    if (!state.zones.length) {
      const span=document.createElement("span");
      span.className="q47-empty-inline";
      span.textContent="Sin zonas excluidas";
      node.appendChild(span);
      return;
    }
    state.zones.forEach(z=>{
      const item=document.createElement("span");
      item.className="q47-zone-chip";
      item.textContent=z.id+" · "+n(Math.min(z.x1,z.x2),0)+","+
        n(Math.min(z.y1,z.y2),0)+" → "+
        n(Math.max(z.x1,z.x2),0)+","+
        n(Math.max(z.y1,z.y2),0);
      node.appendChild(item);
    });
  }

  function renderControls() {
    const body=$("q47ControlRows");
    body.innerHTML="";
    if (!state.controls.length) {
      const row=document.createElement("tr");
      const cell=document.createElement("td");
      cell.colSpan=6;
      cell.className="q47-empty-table";
      cell.textContent="Todavía no hay controles Q47 registrados.";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    state.controls.forEach(c=>{
      const row=document.createElement("tr");
      [
        c.name,
        n(c.rawX,2)+" / "+n(c.rawY,2),
        "Q47."+c.subquad,
        n(c.calcE,2)+" / "+n(c.calcN,2),
        c.status==="PENDIENTE_REFERENCIA_IGN_PNOA" ? "PENDIENTE IGN/PNOA" : "REF. INFORMADA",
        c.residualM===null ? "PENDIENTE" : n(c.residualM,2)+" m"
      ].forEach(text=>{
        const cell=document.createElement("td");
        cell.textContent=text;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }

  function selectionTraceLine(s) {
    const draft=$("q47ControlName").value.trim();
    return "Q47_SELECCION_ACTUAL|PIX_X="+s.rawX+
      "|PIX_Y="+s.rawY+
      "|ESTADO="+(s.rejected ? "RECHAZADO" : "SELECCIONADO")+
      (draft ? "|NOMBRE_BORRADOR="+draft : "")+
      (s.reason ? "|MOTIVO="+s.reason : "")+
      (s.subquad ? "|SUBCUAD="+s.subquad : "")+
      (Number.isFinite(s.u) ? "|U="+s.u : "")+
      (Number.isFinite(s.v) ? "|V="+s.v : "")+
      (Number.isFinite(s.lat) ? "|LAT_CALC="+s.lat : "")+
      (Number.isFinite(s.lon) ? "|LON_CALC="+s.lon : "")+
      (Number.isFinite(s.e) ? "|E_CALC_ETRS89="+s.e : "")+
      (Number.isFinite(s.n) ? "|N_CALC_ETRS89="+s.n : "");
  }

  function traceText() {
    const lines=[];
    lines.push("FUGAWI_IA_CONTROL_Q47_"+VERSION.toUpperCase());
    lines.push("Q47_WEB|VERSION="+VERSION+"|BUILD="+BUILD+
      "|P3N_BASE="+BASE+"|GENERADO="+new Date().toISOString());
    lines.push("Q47_PRUEBA|INICIO="+state.sessionStartedAt+
      "|CONTROLES_HEREDADOS="+state.inheritedControls);
    lines.push("Q47_RASTER|NOMBRE="+(state.fileName || "NO_CARGADO")+
      "|W="+(state.sourceW || 0)+"|H="+(state.sourceH || 0));
    lines.push("Q47_REFERENCIA_PIXEL|W="+REF_W+"|H="+REF_H+
      "|SISTEMA=P3N_GEOMETRIA");
    lines.push("Q47_RASTER_LOGICO_ESPERADO|W="+INPUT_REF_W+
      "|H="+INPUT_REF_H+
      "|CONVERSION=ESCALA_PROPORCIONAL_A_P3N");
    lines.push("Q47_SUBMALLA=ACTIVA");
    lines.push("Q47_SUBMALLA_PERIMETRO=INTACTO");
    lines.push("Q47_SUBMALLA_CELDAS=4");
    lines.push("Q47_MODELO|IDS=65,66,78,77|FRAC_U="+FRAC_U+
      "|FRAC_V="+FRAC_V);
    lines.push("Q47_ANCLA|PIX_X="+C.x+"|PIX_Y="+C.y+
      "|LAT="+C.lat+"|LON="+C.lon);

    lines.push(
      "Q47_AUTOTEST_TIPO=REGRESION_INTERNA_NO_VALIDACION_GEOGRAFICA"
    );
    const cert=certifiedDiagnostic();
    if (cert) {
      let certState="SUPERA_300M";
      if (cert.residual<=200) {
        certState="OBJETIVO_PREFERENTE";
      } else if (cert.residual<=300) {
        certState="ACEPTABLE_OPERATIVO_NO_PREFERENTE";
      }
      lines.push("Q47_CONTROL_CERTIFICADO_HISTORICO"+
        "|PUNTO="+CERT_LA_CAROLINA.id+
        "|PIX_X="+CERT_LA_CAROLINA.x+
        "|PIX_Y="+CERT_LA_CAROLINA.y+
        "|E_REF_ETRS89="+CERT_LA_CAROLINA.e+
        "|N_REF_ETRS89="+CERT_LA_CAROLINA.n+
        "|E_CALC_ETRS89="+cert.solved.e+
        "|N_CALC_ETRS89="+cert.solved.n+
        "|DELTA_E_M="+cert.de+
        "|DELTA_N_M="+cert.dn+
        "|RESIDUAL_M="+cert.residual+
        "|ESTADO="+certState);
    }
    const regressionRef=regressionReferenceDiagnostic();
    lines.push("Q47_TEST_INTERNO_REFERENCIA"+
      "|ID="+Q47_REGRESSION_02.id+
      "|LAT="+Q47_REGRESSION_02.lat+
      "|LON="+Q47_REGRESSION_02.lon+
      "|E_CALC="+regressionRef.e+
      "|N_CALC="+regressionRef.n+
      "|IGN_E="+CERT_LA_CAROLINA.e+
      "|IGN_N="+CERT_LA_CAROLINA.n+
      "|DIF_E_M="+regressionRef.de+
      "|DIF_N_M="+regressionRef.dn+
      "|DIF_M="+regressionRef.residual+
      "|USO=SOLO_REGRESION_INTERNA");

    if (state.selected) {
      const dx=state.selected.rawX-CERT_LA_CAROLINA.x;
      const dy=state.selected.rawY-CERT_LA_CAROLINA.y;
      let modelM=null;
      if (cert && !state.selected.rejected) {
        modelM=Math.hypot(
          state.selected.e-cert.solved.e,
          state.selected.n-cert.solved.n
        );
      }
      lines.push("Q47_SELECCION_VS_CERTIFICADO"+
        "|DX_PIX="+dx+
        "|DY_PIX="+dy+
        "|DIST_PIX="+Math.hypot(dx,dy)+
        (modelM===null ? "" : "|DIST_MODELO_M="+modelM));
    }

    if (state.selected) {
      lines.push(selectionTraceLine(state.selected));
    }

    state.zones.forEach(z=>{
      lines.push("Q47_EXCLUSION|ID="+z.id+
        "|X1="+z.x1+"|Y1="+z.y1+
        "|X2="+z.x2+"|Y2="+z.y2);
    });

    state.rejections.forEach(r=>{
      lines.push("Q47_AUDIT_ESTADO|PUNTO=SIN_NOMBRE"+
        "|PIX_X="+r.rawX+"|PIX_Y="+r.rawY+
        "|ESTADO=RECHAZADO|MOTIVO="+r.reason+
        (r.zoneId ? "|ZONA="+r.zoneId : "")+
        (r.nearestSide ? "|BORDE_Q47="+r.nearestSide : "")+
        (Number.isFinite(r.distancePx) ? "|DIST_Q47_PIX="+r.distancePx : "")+
        (Number.isFinite(r.nearestX) ? "|Q47_NEAR_X="+r.nearestX : "")+
        (Number.isFinite(r.nearestY) ? "|Q47_NEAR_Y="+r.nearestY : ""));
    });

    [...state.controls].reverse().forEach(c=>{
      lines.push("Q47_AUDIT|PUNTO="+c.name+
        "|PIX_X="+c.rawX+"|PIX_Y="+c.rawY+
        "|SUBCUAD="+c.subquad+
        "|U="+c.u+"|V="+c.v);
      lines.push("Q47_AUDIT_COORD|PUNTO="+c.name+
        "|LAT_CALC="+c.lat+"|LON_CALC="+c.lon+
        "|E_CALC_ETRS89="+c.calcE+"|N_CALC_ETRS89="+c.calcN+
        (c.refLat!==null ? "|LAT_REF="+c.refLat : "")+
        (c.refLon!==null ? "|LON_REF="+c.refLon : ""));
      if (c.status==="PENDIENTE_REFERENCIA_IGN_PNOA") {
        lines.push("Q47_AUDIT_IGN|PUNTO="+c.name+
          "|REFERENCIA=IGN_PNOA_PENDIENTE"+
          "|RESIDUAL_M=PENDIENTE");
      } else {
        lines.push("Q47_AUDIT_IGN|PUNTO="+c.name+
          "|E_ETRS89="+c.refE+"|N_ETRS89="+c.refN+
          "|DELTA_E_M="+c.deltaE+"|DELTA_N_M="+c.deltaN+
          "|RESIDUAL_M="+c.residualM+
          "|RESIDUAL_METODO="+c.residualMethod+
          "|RESIDUAL_UTM_M="+c.residualUtmM+
          (c.residualGeoM!==null ? "|RESIDUAL_GEO_M="+c.residualGeoM : ""));
      }
      lines.push("Q47_AUDIT_ESTADO|PUNTO="+c.name+
        "|ESTADO="+c.status);
    });

    lines.push("Q47_RESUMEN|CONTROLES="+state.controls.length+
      "|EXCLUSIONES="+state.zones.length+
      "|RECHAZOS_SESION="+state.rejections.length+
      "|SELECCION_ACTUAL="+(state.selected ? 1 : 0));
    lines.push("Q47_P3N_042_MODIFICADO=0");
    return lines.join("\n")+"\n";
  }

  function downloadTrace() {
    const blob=new Blob([traceText()],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    a.href=url;
    a.download="Fugawi_Q47_Validacion_v008_"+stamp+".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setMessage("Traza Q47 exportada. P3N_042 no ha sido modificado.","ok");
  }

  function clearControls() {
    if (!state.controls.length) return;
    if (!confirm("¿Vaciar los controles Q47 registrados localmente?")) return;
    state.controls=[];
    state.rejections=[];
    saveLocal();
    renderControls();
    setMessage("Registro local de controles vaciado.","ok");
  }

  function runSelfTest() {
    const tests=[
      {
        name:"TEST_Q47_ANCLA",
        x:9601.197356,
        y:4441.385330,
        lat:41.138959560314,
        lon:-5.331734591888
      },
      {
        name:Q47_REGRESSION_02.id,
        x:Q47_REGRESSION_02.x,
        y:Q47_REGRESSION_02.y,
        lat:Q47_REGRESSION_02.lat,
        lon:Q47_REGRESSION_02.lon
      }
    ];
    const results=tests.map(t=>{
      const s=solveQ47Pixel(t.x,t.y);
      if (!s) return false;
      return Math.abs(s.lat-t.lat)<=0.000001 &&
        Math.abs(s.lon-t.lon)<=0.000001;
    });
    const synthetic=solveQ47Pixel(C.x,C.y);
    const selectionLine=synthetic ? selectionTraceLine(synthetic) : "";
    const tracePass=
      selectionLine.startsWith("Q47_SELECCION_ACTUAL|") &&
      selectionLine.includes("|SUBCUAD=") &&
      selectionLine.includes("|LAT_CALC=") &&
      selectionLine.includes("|E_CALC_ETRS89=");
    const cert=certifiedDiagnostic();
    const regressionRef=regressionReferenceDiagnostic();
    const certPass=Boolean(cert) &&
      cert.residual>292 &&
      cert.residual<294;
    const regressionPass=
      regressionRef.residual>292 &&
      regressionRef.residual<294;
    const pass=
      results.every(Boolean) &&
      tracePass &&
      certPass &&
      regressionPass;
    const badge=$("q47RuntimeBadge");
    badge.textContent=pass ? "AUTOTEST Q47 · PASS" : "AUTOTEST Q47 · FAIL";
    badge.classList.toggle("fail",!pass);
    if (!pass) {
      $("q47RegisterBtn").disabled=true;
      $("q47RasterInput").disabled=true;
      setMessage("Autotest Q47 fallido. El validador queda bloqueado para evitar resultados no fiables.","error");
    }
    return pass;
  }

  function openValidator() {
    const section=$("q47Validator");
    section.hidden=false;
    section.scrollIntoView({behavior:"smooth",block:"start"});
    location.hash="q47";
  }

  function closeValidator() {
    $("q47Validator").hidden=true;
    if (location.hash==="#q47") history.replaceState(null,"",location.pathname+location.search);
  }

  function handleCanvasPointer(event) {
    if (!state.sourceCrop) {
      setMessage("Selecciona primero 4-5 SALAMANCA.PNG desde el iPad.","error");
      return;
    }
    const raw=canvasEventToRaw(event);
    if (state.mode==="exclusion") {
      handleExclusionTap(raw);
      return;
    }
    selectControl(raw.x,raw.y);
  }

  function wire() {
    $("q47EntryBtn").addEventListener("click",openValidator);
    $("q47CloseBtn").addEventListener("click",closeValidator);
    $("q47RasterInput").addEventListener("change",event=>{
      const file=event.target.files && event.target.files[0];
      if (!file) return;
      loadRaster(file).catch(err=>{
        setMessage(err.message || "No se pudo cargar el raster.","error");
      });
    });
    $("q47Canvas").addEventListener("pointerdown",handleCanvasPointer);
    $("q47RefE").addEventListener("input",updateResidualPreview);
    $("q47RefN").addEventListener("input",updateResidualPreview);
    $("q47RefLat").addEventListener("input",updateResidualPreview);
    $("q47RefLon").addEventListener("input",updateResidualPreview);
    $("q47RegisterBtn").addEventListener("click",registerControl);
    $("q47AddExclusionBtn").addEventListener("click",startExclusion);
    $("q47UndoZoneBtn").addEventListener("click",undoZone);
    $("q47ClearZonesBtn").addEventListener("click",clearZones);
    $("q47ExportBtn").addEventListener("click",downloadTrace);
    $("q47ClearControlsBtn").addEventListener("click",clearControls);
    $("q47NewTestBtn").addEventListener("click",newQ47Test);
    window.addEventListener("resize",redraw);
  }

  if (!$("q47Validator")) return;
  wire();
  resetResultFields();
  renderZones();
  renderControls();
  updateCertifiedPanel();
  runSelfTest();
  if (location.hash==="#q47") {
    $("q47Validator").hidden=false;
  }
})();