(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const VERSION = "v003";
  const BASE = "P3N_042";
  const REF_W = 18316;
  const REF_H = 13828;
  const FRAC_U = 0.441195799;
  const FRAC_V = 0.701011619;
  const STORAGE_ZONES = "fugawiQ47ExclusionZonesV003";
  const STORAGE_CONTROLS = "fugawiQ47ControlsV003";
  const CROP_PADDING = 260;

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
    rejections:[],
    zoneDraft:null,
    mode:"control"
  };

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

  function exclusionAt(x,y) {
    return state.zones.find(z=>
      x>=Math.min(z.x1,z.x2) &&
      x<=Math.max(z.x1,z.x2) &&
      y>=Math.min(z.y1,z.y2) &&
      y<=Math.max(z.y1,z.y2)
    ) || null;
  }

  async function readPngSize(file) {
    const buf=await file.slice(0,24).arrayBuffer();
    const b=new Uint8Array(buf);
    const sig=[137,80,78,71,13,10,26,10];
    if (b.length<24 || !sig.every((v,i)=>b[i]===v)) {
      throw new Error("El archivo seleccionado no es un PNG válido.");
    }
    const view=new DataView(buf);
    return {w:view.getUint32(16,false),h:view.getUint32(20,false)};
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
    setMessage("Leyendo cabecera PNG y preparando recorte Q47…","working");
    clearRaster();
    const size=await readPngSize(file);
    state.file=file;
    state.fileName=file.name;
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

    if (!state.bitmap) {
      state.objectUrl=URL.createObjectURL(file);
      state.image=await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error("No se pudo decodificar el raster PNG."));
        img.src=state.objectUrl;
      });
    }

    fitCanvas();
    redraw();
    $("q47RasterMeta").textContent=
      file.name+" · "+size.w+" × "+size.h+" px · recorte Q47 local";
    setMessage("Q47 preparado. Toca un objeto físico inequívoco dentro de la celda.","ok");
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

  function redraw() {
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

  function selectControl(rawX,rawY) {
    resetResultFields();

    if (!pointInPolygon(rawX,rawY,Q47)) {
      state.selected={rawX:rawX,rawY:rawY,rejected:true,reason:"FUERA_Q47"};
      state.rejections.push({
        at:new Date().toISOString(),
        rawX:rawX,
        rawY:rawY,
        reason:"FUERA_Q47"
      });
      setMessage("Control rechazado automáticamente: el punto está fuera del perímetro Q47.","error");
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
    setMessage("Punto válido en Q47."+solved.subquad+". Introduce la referencia IGN ETRS89/UTM30 y registra el control.","ok");
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
      setMessage("Escribe un nombre identificativo para el objeto físico.","error");
      $("q47ControlName").focus();
      return;
    }
    const residual=residualForSelection();
    if (!residual) {
      setMessage("Para registrar el residual debes introducir E y N oficiales en ETRS89 / UTM30.","error");
      $("q47RefE").focus();
      return;
    }

    const refLat=readNumber("q47RefLat");
    const refLon=readNumber("q47RefLon");
    const geoResidual=
      refLat!==null && refLon!==null ?
      haversine(state.selected.lat,state.selected.lon,refLat,refLon) :
      null;

    const primaryResidual=geoResidual!==null ?
      geoResidual : residual.mag;
    const residualMethod=geoResidual!==null ?
      "HAVERSINE_LATLON" : "ETRS89_UTM30";

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
      refE:residual.refE,
      refN:residual.refN,
      refLat:refLat,
      refLon:refLon,
      deltaE:residual.de,
      deltaN:residual.dn,
      residualUtmM:residual.mag,
      residualGeoM:geoResidual,
      residualM:primaryResidual,
      residualMethod:residualMethod,
      status:"REGISTRADO"
    };
    state.controls.unshift(control);
    saveLocal();
    renderControls();
    setMessage("Control registrado. Residual "+n(control.residualM,3)+" m.","ok");
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
        n(c.deltaE,2)+" / "+n(c.deltaN,2),
        n(c.residualM,2)+" m"
      ].forEach(text=>{
        const cell=document.createElement("td");
        cell.textContent=text;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }

  function traceText() {
    const lines=[];
    lines.push("FUGAWI_IA_CONTROL_Q47_"+VERSION.toUpperCase());
    lines.push("Q47_WEB|VERSION="+VERSION+"|P3N_BASE="+BASE+
      "|GENERADO="+new Date().toISOString());
    lines.push("Q47_RASTER|NOMBRE="+(state.fileName || "NO_CARGADO")+
      "|W="+(state.sourceW || 0)+"|H="+(state.sourceH || 0));
    lines.push("Q47_SUBMALLA=ACTIVA");
    lines.push("Q47_SUBMALLA_PERIMETRO=INTACTO");
    lines.push("Q47_SUBMALLA_CELDAS=4");
    lines.push("Q47_MODELO|IDS=65,66,78,77|FRAC_U="+FRAC_U+
      "|FRAC_V="+FRAC_V);
    lines.push("Q47_ANCLA|PIX_X="+C.x+"|PIX_Y="+C.y+
      "|LAT="+C.lat+"|LON="+C.lon);

    state.zones.forEach(z=>{
      lines.push("Q47_EXCLUSION|ID="+z.id+
        "|X1="+z.x1+"|Y1="+z.y1+
        "|X2="+z.x2+"|Y2="+z.y2);
    });

    state.rejections.forEach(r=>{
      lines.push("Q47_AUDIT_ESTADO|PUNTO=SIN_NOMBRE"+
        "|PIX_X="+r.rawX+"|PIX_Y="+r.rawY+
        "|ESTADO=RECHAZADO|MOTIVO="+r.reason+
        (r.zoneId ? "|ZONA="+r.zoneId : ""));
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
      lines.push("Q47_AUDIT_IGN|PUNTO="+c.name+
        "|E_ETRS89="+c.refE+"|N_ETRS89="+c.refN+
        "|DELTA_E_M="+c.deltaE+"|DELTA_N_M="+c.deltaN+
        "|RESIDUAL_M="+c.residualM+
        "|RESIDUAL_METODO="+c.residualMethod+
        "|RESIDUAL_UTM_M="+c.residualUtmM+
        (c.residualGeoM!==null ? "|RESIDUAL_GEO_M="+c.residualGeoM : ""));
      lines.push("Q47_AUDIT_ESTADO|PUNTO="+c.name+
        "|ESTADO="+c.status);
    });

    lines.push("Q47_RESUMEN|CONTROLES="+state.controls.length+
      "|EXCLUSIONES="+state.zones.length+
      "|RECHAZOS_SESION="+state.rejections.length);
    lines.push("Q47_P3N_042_MODIFICADO=0");
    return lines.join("\n")+"\n";
  }

  function downloadTrace() {
    const blob=new Blob([traceText()],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    a.href=url;
    a.download="Fugawi_Q47_Validacion_v003_"+stamp+".txt";
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
        name:"Vallesa",
        x:9601.197356,
        y:4441.385330,
        lat:41.138959560314,
        lon:-5.331734591888
      },
      {
        name:"La Carolina",
        x:9893.92,
        y:4693.69,
        lat:41.118667361632,
        lon:-5.302340503458
      }
    ];
    const results=tests.map(t=>{
      const s=solveQ47Pixel(t.x,t.y);
      if (!s) return false;
      return Math.abs(s.lat-t.lat)<=0.000001 &&
        Math.abs(s.lon-t.lon)<=0.000001;
    });
    const pass=results.every(Boolean);
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
    window.addEventListener("resize",redraw);
  }

  if (!$("q47Validator")) return;
  wire();
  resetResultFields();
  renderZones();
  renderControls();
  runSelfTest();
  if (location.hash==="#q47") {
    $("q47Validator").hidden=false;
  }
})();