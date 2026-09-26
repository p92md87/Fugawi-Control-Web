(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const VERSION = "v025";
  const BUILD = "025.0";
  const STORAGE_CONTROLS = "fugawiRawControlsV010";
  const DOMAIN = "PIXEL_RASTER_ORIGINAL";
  const GRANADA_CAMPAIGN = {
    id:"GRANADA_6_IGN_PNOA_V002",
    rasterName:"GRANADA 3_6.PNG",
    width:18748,
    height:13831,
    sha256:"a366c87f84901066e2c04125ba6f4ef1dcebe11206b11e88eb6d2305a3eca3d5",
    targets:[
      {
        id:"GR-CF01",
        name:"Estación de Archidona · paso carretera-ferrocarril",
        type:"CRUCE_CARRETERA_FERROCARRIL",
        zone:"Oeste",
        criterion:"Centro geométrico del cruce entre el eje ferroviario y el eje viario.",
        navX:0.20,
        navY:0.25
      },
      {
        id:"GR-CF02",
        name:"Presa de Los Bermejales",
        type:"PRESA",
        zone:"Suroeste / interior",
        criterion:"Cruce del eje de coronación de la presa con el eje del cauce.",
        navX:0.35,
        navY:0.30
      },
      {
        id:"GR-CF03",
        name:"Presa de Cubillas",
        type:"PRESA",
        zone:"Centro-norte",
        criterion:"Cruce del eje de coronación de la presa con el eje del cauce.",
        navX:0.40,
        navY:0.17
      },
      {
        id:"GR-CF04",
        name:"Presa de Iznájar",
        type:"PRESA",
        zone:"Noroeste / interior",
        criterion:"Cruce del eje de coronación de la presa con el eje del cauce.",
        navX:0.20,
        navY:0.17
      },
      {
        id:"GR-CF05",
        name:"Guadix · cruce viario-ferroviario inequívoco próximo a la estación",
        type:"CRUCE_CARRETERA_FERROCARRIL",
        zone:"Este",
        criterion:"Centro geométrico del cruce físico; no usar rótulo ni centro de estación.",
        navX:0.55,
        navY:0.15
      },
      {
        id:"GR-CF06",
        name:"Gádor · cruce viario-ferroviario inequívoco próximo a la estación",
        type:"CRUCE_CARRETERA_FERROCARRIL",
        zone:"Extremo este",
        criterion:"Centro geométrico del cruce físico; no usar rótulo ni centro de estación.",
        navX:0.73,
        navY:0.32
      }
    ]
  };

  const BARCELONA_CAMPAIGN = {
    id:"BARCELONA_5_PRESAS_V001",
    rasterName:"Barcelona 5_2",
    width:2047,
    height:1536,
    sha256:"c5e9fc3b76fd4ee83ebbc21f2be77b00407497e969706c952c4836091a62ac7e",
    title:"Barcelona · 5 presas",
    objective:"5_CONTROLES_INDEPENDIENTES_BARCELONA",
    downloadStem:"Fugawi_Barcelona_5_presas_RAW_",
    requireManualConfirm:true,
    allowProportionalRaster:true,
    strictHash:false,
    guideMode:"CRUCETA_GUIA_NORMALIZADA_P3N071",
    targets:[
      {
        id:"BC-CF-001",
        name:"Presa de Camarasa",
        type:"PRESA",
        zone:"Oeste / Noguera Pallaresa",
        criterion:"Identifica visualmente el cierre de la presa y confirma manualmente la cruceta antes de registrar.",
        guideX:555.042,
        guideY:767.188
      },
      {
        id:"BC-CF-002",
        name:"Presa de La Baells",
        type:"PRESA",
        zone:"Centro-norte / Llobregat",
        criterion:"Identifica visualmente el cierre de la presa y confirma manualmente la cruceta antes de registrar.",
        guideX:1094.120,
        guideY:614.328
      },
      {
        id:"BC-CF-003",
        name:"Presa de Sau",
        type:"PRESA",
        zone:"Este / Ter",
        criterion:"Identifica visualmente el cierre de la presa y confirma manualmente la cruceta antes de registrar.",
        guideX:1384.130,
        guideY:726.047
      },
      {
        id:"BC-CF-004",
        name:"Presa de Sant Ponç",
        type:"PRESA",
        zone:"Centro / Cardener",
        criterion:"Identifica visualmente el cierre de la presa y confirma manualmente la cruceta antes de registrar.",
        guideX:945.829,
        guideY:730.082
      },
      {
        id:"BC-CF-005",
        name:"Presa de la Llosa del Cavall",
        type:"PRESA",
        zone:"Centro-norte / Cardener",
        criterion:"Identifica visualmente el cierre de la presa y confirma manualmente la cruceta antes de registrar.",
        guideX:933.875,
        guideY:630.194
      }
    ]
  };

  const BARCELONA_CLEAR_CAMPAIGN = {
    id:"BARCELONA_3_PUNTOS_OFICIALES_V001",
    rasterName:"Barcelona 5_2",
    width:2047,
    height:1536,
    sha256:"c5e9fc3b76fd4ee83ebbc21f2be77b00407497e969706c952c4836091a62ac7e",
    title:"Barcelona · 3 puntos oficiales IGN/PNOA",
    objective:"3_CONTROLES_BARCELONA_PRELOCALIZADOS_EN_IGN_PNOA",
    downloadStem:"Fugawi_Barcelona_3_puntos_oficiales_RAW_",
    requireManualConfirm:true,
    allowProportionalRaster:true,
    strictHash:false,
    guideMode:"GUIA_DESDE_REFERENCIA_OFICIAL_VERIFICADA_EN_IGN_PNOA_V001",
    targets:[
      {
        id:"BC-OF-001",
        name:"Presa de Talarn / Sant Antoni",
        type:"PRESA",
        zone:"Noroeste · Talarn",
        criterion:"Localizada previamente en cartografía/ortofoto oficial. Ajusta la cruceta al centro geométrico del cuerpo de presa visible en el mapa histórico, no al rótulo ni al embalse.",
        guideX:572.651,
        guideY:569.758
      },
      {
        id:"BC-OF-002",
        name:"Presa de Oliana",
        type:"PRESA",
        zone:"Norte-centro · Oliana",
        criterion:"Localizada previamente en cartografía/ortofoto oficial. Ajusta la cruceta al centro geométrico del cuerpo de presa, evitando carretera, central o rótulos próximos.",
        guideX:779.962,
        guideY:633.479
      },
      {
        id:"BC-OF-003",
        name:"Presa de Darnius-Boadella",
        type:"PRESA",
        zone:"Noreste · Darnius",
        criterion:"Localizada previamente en cartografía/ortofoto oficial. Ajusta la cruceta al centro geométrico del cuerpo de presa; no uses el centro del embalse ni la carretera de acceso.",
        guideX:1611.910,
        guideY:452.405
      }
    ]
  };

  const BARCELONA_REVIEW_CAMPAIGN = {
    id:"BARCELONA_REVISION_3_CONFLUENCIAS_V001",
    rasterName:"Barcelona 5_2",
    width:2047,
    height:1536,
    sha256:"c5e9fc3b76fd4ee83ebbc21f2be77b00407497e969706c952c4836091a62ac7e",
    title:"Barcelona · revisión 3 confluencias",
    objective:"3_CONTROLES_INDEPENDIENTES_BARCELONA_DISTRIBUIDOS",
    downloadStem:"Fugawi_Barcelona_revision_3_confluencias_RAW_",
    requireManualConfirm:true,
    allowProportionalRaster:true,
    strictHash:false,
    guideMode:"CRUCETA_GUIA_NORMALIZADA_CONFLUENCIAS_V001",
    targets:[
      {
        id:"BC-RV-001",
        name:"Confluencia Noguera Pallaresa–Segre",
        type:"CONFLUENCIA",
        zone:"Oeste · Camarasa",
        criterion:"Fija el vértice hidrográfico donde el eje de la Noguera Pallaresa entra en el Segre; ignora rótulos y carreteras próximas.",
        guideX:556.152,
        guideY:769.623
      },
      {
        id:"BC-RV-002",
        name:"Confluencia Anoia–Llobregat",
        type:"CONFLUENCIA",
        zone:"Sur-centro · Martorell",
        criterion:"Fija el vértice hidrográfico de unión de ambos cauces; no uses el centro urbano ni los puentes próximos.",
        guideX:1123.956,
        guideY:1085.310
      },
      {
        id:"BC-RV-003",
        name:"Confluencia Freser–Ter",
        type:"CONFLUENCIA",
        zone:"Noreste · Ripoll",
        criterion:"Fija el vértice hidrográfico donde el Freser desemboca en el Ter; no uses el rótulo RIPOLL ni cruces viarios próximos.",
        guideX:1263.385,
        guideY:560.978
      }
    ]
  };

  function activeCampaign() {
    if (state.campaignKey==="barcelona_clear") return BARCELONA_CLEAR_CAMPAIGN;
    if (state.campaignKey==="barcelona_review") return BARCELONA_REVIEW_CAMPAIGN;
    if (state.campaignKey==="barcelona") return BARCELONA_CAMPAIGN;
    if (state.campaignKey==="granada") return GRANADA_CAMPAIGN;
    return null;
  }

  const state = {
    file:null,
    fileName:"",
    sourceW:0,
    sourceH:0,
    fileSize:0,
    mime:"",
    sha256:"",
    rasterKey:"",
    objectUrl:"",
    selected:null,
    controls:loadJson(STORAGE_CONTROLS,[]),
    zoom:1,
    pointers:new Map(),
    gestureMode:"",
    gestureMoved:false,
    gestureHadPinch:false,
    panStart:null,
    pinchStart:null,
    campaignActive:false,
    campaignKey:"",
    campaignTargetId:"",
    selectionOrigin:"",
    sessionStartedAt:new Date().toISOString()
  };

  function loadJson(key,fallback) {
    try {
      const raw=localStorage.getItem(key);
      if (!raw) return fallback;
      const value=JSON.parse(raw);
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_CONTROLS,JSON.stringify(state.controls));
  }

  function n(v,d=3) {
    return Number.isFinite(v) ? Number(v).toFixed(d) : "—";
  }

  function safeName(text) {
    return String(text || "raster")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-zA-Z0-9_-]+/g,"_")
      .replace(/^_+|_+$/g,"") || "raster";
  }

  function escapeTrace(text) {
    return String(text || "")
      .replace(/\r?\n/g," ")
      .replace(/\|/g,"/")
      .trim();
  }

  function campaignRasterCheck() {
    const spec=activeCampaign();
    if (!spec) {
      return {ok:false,level:"pending",text:"Selecciona primero una campaña."};
    }
    if (!state.sourceW || !state.sourceH) {
      return {ok:false,level:"pending",text:"Carga primero el raster exacto "+spec.rasterName+"."};
    }

    const sameSize=state.sourceW===spec.width && state.sourceH===spec.height;
    const sourceRatio=state.sourceW/state.sourceH;
    const refRatio=spec.width/spec.height;
    const ratioError=Math.abs(sourceRatio/refRatio-1);

    if (!sameSize) {
      if (!spec.allowProportionalRaster || ratioError>0.003) {
        return {
          ok:false,
          level:"error",
          text:"Raster incompatible: "+state.sourceW+" × "+state.sourceH+
            " px. La referencia es "+spec.width+" × "+spec.height+
            " px y no conserva exactamente su proporción."
        };
      }
    }

    if (spec.strictHash!==false &&
        state.sha256 && state.sha256!=="NO_DISPONIBLE" &&
        state.sha256.toLowerCase()!==spec.sha256) {
      return {
        ok:false,
        level:"error",
        text:"SHA-256 distinto del raster previsto para esta campaña. No registres controles."
      };
    }

    if (!sameSize && spec.allowProportionalRaster) {
      return {
        ok:true,
        level:"warn",
        text:"Raster proporcional detectado: "+state.sourceW+" × "+state.sourceH+
          " px. Las crucetas guía se escalarán automáticamente desde la referencia "+
          spec.width+" × "+spec.height+"; confirma siempre el objeto visualmente."
      };
    }

    if (state.sha256==="NO_DISPONIBLE" || spec.strictHash===false) {
      return {
        ok:true,
        level:"warn",
        text:"Dimensiones compatibles. La captura queda identificada por dimensiones y SHA-256 real exportado; confirma visualmente cada objeto."
      };
    }

    return {
      ok:true,
      level:"ok",
      text:"Raster verificado para "+spec.title+": dimensiones y SHA-256 coinciden."
    };
  }

  function campaignControls() {
    const spec=activeCampaign();
    if (!spec) return [];
    return currentControls().filter(c=>c.campaign===spec.id);
  }

  function campaignCaptured(targetId) {
    return campaignControls().some(c=>c.campaignTarget===targetId);
  }

  function campaignTarget() {
    const spec=activeCampaign();
    if (!spec) return null;
    return spec.targets.find(t=>t.id===state.campaignTargetId) || null;
  }

  function clearRawSelection() {
    state.selected=null;
    state.selectionOrigin="";
    $("rawCrosshair").hidden=true;
    $("rawX").textContent="—";
    $("rawY").textContent="—";
    drawLoupe();
  }

  function setCampaignTarget(targetId) {
    const spec=activeCampaign();
    if (!spec) return;
    const target=spec.targets.find(t=>t.id===targetId);
    if (!target) return;
    state.campaignTargetId=target.id;
    clearRawSelection();
    $("rawControlName").value=target.name;
    $("rawControlName").readOnly=true;
    $("rawControlType").value=target.type;
    $("rawControlType").disabled=true;
    $("rawCampaignCurrent").hidden=false;
    $("rawCampaignCurrentId").textContent=target.id+" · "+target.zone;
    $("rawCampaignCurrentText").textContent=target.name+" — "+target.criterion;
    $("rawRegisterBtn").textContent="Registrar "+target.id;
    if ($("rawQuickAcceptBtn")) {
      $("rawQuickAcceptBtn").textContent="Aceptar "+target.id;
    }
    renderCampaign();
  }

  function goToCampaignZone() {
    const spec=activeCampaign();
    const target=campaignTarget();
    if (!spec || !target || !state.sourceW || !state.sourceH) {
      setMessage("Carga el raster y selecciona primero un control de campaña.","error");
      return;
    }

    const check=campaignRasterCheck();
    if (!check.ok) {
      setMessage(check.text,"error");
      return;
    }

    const viewport=$("rawViewport");
    const zoom=Math.max(4,state.zoom);
    setZoom(zoom);

    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        const stage=$("rawStage");
        const stageWidth=stage.getBoundingClientRect().width;
        const stageHeight=stage.getBoundingClientRect().height;
        const hasGuide=Number.isFinite(target.guideX) && Number.isFinite(target.guideY);
        const guideRawX=hasGuide ?
          target.guideX/spec.width*state.sourceW : NaN;
        const guideRawY=hasGuide ?
          target.guideY/spec.height*state.sourceH : NaN;
        const centerX=hasGuide ?
          guideRawX/state.sourceW*stageWidth :
          target.navX*stageWidth;
        const centerY=hasGuide ?
          guideRawY/state.sourceH*stageHeight :
          target.navY*stageHeight;

        viewport.scrollLeft=Math.max(
          0,
          Math.min(
            stageWidth-viewport.clientWidth,
            centerX-viewport.clientWidth/2
          )
        );
        viewport.scrollTop=Math.max(
          0,
          Math.min(
            stageHeight-viewport.clientHeight,
            centerY-viewport.clientHeight/2
          )
        );

        if (hasGuide) {
          selectRaw(guideRawX,guideRawY,"guide");
          setMessage(
            target.id+
            ": cruceta guía reescalada al raster actual ("+
            state.sourceW+" × "+state.sourceH+
            "). Identifica visualmente la presa y toca o mueve la cruceta antes de registrar.",
            "working"
          );
        } else {
          clearRawSelection();
          setMessage(
            target.id+
            ": zona aproximada centrada. Busca visualmente el objeto, amplía con dos dedos y toca sólo cuando lo identifiques.",
            "working"
          );
        }
      });
    });
  }

  function selectNextCampaignTarget() {
    const spec=activeCampaign();
    if (!spec) return;
    const next=spec.targets.find(t=>!campaignCaptured(t.id));
    if (next) {
      setCampaignTarget(next.id);
      if (state.sourceW && state.sourceH) goToCampaignZone();
      return;
    }
    state.campaignTargetId="";
    $("rawCampaignCurrent").hidden=true;
    $("rawControlName").value="";
    $("rawControlName").readOnly=true;
    $("rawControlType").disabled=true;
    $("rawRegisterBtn").textContent="Campaña completa";
    if ($("rawQuickAcceptBtn")) {
      $("rawQuickAcceptBtn").textContent="Campaña completa";
      $("rawQuickAcceptBtn").disabled=true;
    }
    renderCampaign();
  }

  function renderCampaign() {
    const panel=$("rawGranadaCampaign");
    if (!panel) return;
    panel.hidden=!state.campaignActive;
    if (!state.campaignActive) return;
    const spec=activeCampaign();
    if (!spec) return;

    $("rawCampaignTitle").textContent=spec.title;
    $("rawCampaignNote").textContent=spec.requireManualConfirm ?
      "La cruceta roja inicial es sólo una guía aproximada. Para conservar la independencia del control, debes identificar visualmente el objeto y tocar o mover la cruceta al menos una vez antes de registrar." :
      "«Ir a zona» sólo centra una región amplia del raster. Selecciona exclusivamente el centro geométrico del objeto físico indicado.";

    const check=campaignRasterCheck();
    const stateNode=$("rawCampaignRasterState");
    stateNode.textContent=check.text;
    stateNode.className="raw-campaign-raster "+check.level;

    const captured=campaignControls();
    $("rawCampaignProgress").textContent=captured.length+" / "+spec.targets.length;

    const exportBtn=$("rawCampaignExportBtn");
    const exportHint=$("rawCampaignExportHint");
    const complete=captured.length===spec.targets.length;
    if (exportBtn) {
      exportBtn.disabled=!complete;
      exportBtn.textContent=complete ?
        "EXPORTAR RESULTADO .TXT" :
        "COMPLETA LOS "+spec.targets.length+" PUNTOS PARA EXPORTAR";
      exportBtn.classList.toggle("ready",complete);
    }
    if (exportHint) {
      exportHint.textContent=complete ?
        "Campaña completa. Pulsa el botón para descargar la traza y adjuntarla en el chat." :
        "Faltan "+(spec.targets.length-captured.length)+" punto(s). El botón se activará al completar la campaña.";
    }

    const list=$("rawCampaignTargets");
    list.innerHTML="";
    spec.targets.forEach((target,index)=>{
      const done=campaignCaptured(target.id);
      const button=document.createElement("button");
      button.type="button";
      button.className="raw-campaign-target"+
        (done ? " done" : "")+
        (state.campaignTargetId===target.id ? " active" : "");
      button.disabled=done;
      const id=document.createElement("strong");
      id.textContent=String(index+1);
      const name=document.createElement("span");
      name.textContent=target.name;
      const meta=document.createElement("small");
      meta.textContent=target.id+" · "+(done ? "CAPTURADO" : target.zone)+" · "+target.criterion;
      button.append(id,name,meta);
      if (!done) {
        button.addEventListener("click",()=>{
          setCampaignTarget(target.id);
          goToCampaignZone();
        });
      }
      list.appendChild(button);
    });
  }

  function activateCampaign(key) {
    let spec=GRANADA_CAMPAIGN;
    if (key==="barcelona") spec=BARCELONA_CAMPAIGN;
    if (key==="barcelona_review") spec=BARCELONA_REVIEW_CAMPAIGN;
    if (key==="barcelona_clear") spec=BARCELONA_CLEAR_CAMPAIGN;
    $("rawValidator").hidden=false;
    state.campaignActive=true;
    state.campaignKey=key;
    state.campaignTargetId="";
    state.selectionOrigin="";
    $("rawControlName").readOnly=true;
    $("rawControlType").disabled=true;
    const check=campaignRasterCheck();
    if (!check.ok && check.level==="error") {
      setMessage(check.text,"error");
    } else if (!state.sourceW) {
      setMessage("Campaña "+spec.title+" activada. Selecciona el raster exacto.","working");
    } else {
      setMessage(check.text,check.level==="ok" ? "ok" : "working");
    }
    selectNextCampaignTarget();
    $("rawGranadaCampaign").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function activateGranadaCampaign() {
    activateCampaign("granada");
  }

  function activateBarcelonaCampaign() {
    activateCampaign("barcelona");
  }

  function activateBarcelonaReviewCampaign() {
    activateCampaign("barcelona_review");
  }

  function activateBarcelonaClearCampaign() {
    activateCampaign("barcelona_clear");
  }

  function exitCampaign() {
    state.campaignActive=false;
    state.campaignKey="";
    state.campaignTargetId="";
    state.selectionOrigin="";
    $("rawGranadaCampaign").hidden=true;
    $("rawCampaignCurrent").hidden=true;
    $("rawControlName").readOnly=false;
    $("rawControlType").disabled=false;
    $("rawControlName").value="";
    $("rawControlNotes").value="";
    $("rawRegisterBtn").textContent="Registrar control RAW";
    if ($("rawQuickAcceptBtn")) {
      $("rawQuickAcceptBtn").textContent="Aceptar posición seleccionada";
      $("rawQuickAcceptBtn").disabled=false;
    }
    setMessage("Modo RAW genérico activo.","ok");
  }

  function setMessage(text,type="") {
    const node=$("rawMessage");
    node.textContent=text;
    node.className="q47-message"+(type ? " "+type : "");
  }

  async function sha256File(file) {
    try {
      if (!window.crypto || !window.crypto.subtle) return "NO_DISPONIBLE";
      const buffer=await file.arrayBuffer();
      const digest=await crypto.subtle.digest("SHA-256",buffer);
      return Array.from(new Uint8Array(digest))
        .map(v=>v.toString(16).padStart(2,"0"))
        .join("");
    } catch (_) {
      return "NO_DISPONIBLE";
    }
  }

  function clearImage() {
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl="";
    state.file=null;
    state.fileName="";
    state.sourceW=0;
    state.sourceH=0;
    state.fileSize=0;
    state.mime="";
    state.sha256="";
    state.rasterKey="";
    state.selected=null;
    $("rawImage").removeAttribute("src");
    $("rawCrosshair").hidden=true;
    $("rawMapHint").classList.remove("hidden");
    $("rawNudgeDock").hidden=true;
    clearSelectionFields();
    drawLoupe();
  }

  function rasterKey() {
    if (state.sha256 && state.sha256!=="NO_DISPONIBLE") {
      return state.sha256;
    }
    return state.fileName+"|"+state.sourceW+"x"+state.sourceH+"|"+state.fileSize;
  }

  function currentControls() {
    if (!state.rasterKey) return [];
    return state.controls.filter(c=>c.rasterKey===state.rasterKey);
  }

  function clampZoom(value) {
    return Math.max(1,Math.min(8,value));
  }

  function setZoom(value,anchorX=null,anchorY=null) {
    if (!state.sourceW) return;

    const stage=$("rawStage");
    const viewport=$("rawViewport");
    const oldWidth=stage.getBoundingClientRect().width || viewport.clientWidth;
    const oldHeight=stage.getBoundingClientRect().height || viewport.clientHeight;
    const localAnchorX=Number.isFinite(anchorX) ? anchorX : viewport.clientWidth/2;
    const localAnchorY=Number.isFinite(anchorY) ? anchorY : viewport.clientHeight/2;
    const normX=oldWidth>0 ?
      (viewport.scrollLeft+localAnchorX)/oldWidth : 0.5;
    const normY=oldHeight>0 ?
      (viewport.scrollTop+localAnchorY)/oldHeight : 0.5;

    state.zoom=clampZoom(value);
    const usable=Math.max(320,viewport.clientWidth-2);
    const width=Math.round(usable*state.zoom);
    const height=Math.round(width*state.sourceH/state.sourceW);
    stage.style.width=width+"px";
    stage.style.height=height+"px";

    requestAnimationFrame(()=>{
      if (Number.isFinite(anchorX) && Number.isFinite(anchorY)) {
        viewport.scrollLeft=Math.max(0,normX*width-localAnchorX);
        viewport.scrollTop=Math.max(0,normY*height-localAnchorY);
      }
      positionCrosshair();
    });

    $("rawZoom").textContent=
      (Math.round(state.zoom*100)/100).toFixed(
        Math.abs(state.zoom-Math.round(state.zoom))<0.005 ? 0 : 2
      )+"× visual";
    [1,2,4].forEach(z=>{
      const b=$("rawZoom"+z+"Btn");
      if (b) b.classList.toggle("active",Math.abs(state.zoom-z)<0.02);
    });
  }

  function pointerDistance(a,b) {
    return Math.hypot(a.x-b.x,a.y-b.y);
  }

  function pointerMidpoint(a,b,viewport) {
    const rect=viewport.getBoundingClientRect();
    return {
      x:(a.x+b.x)/2-rect.left,
      y:(a.y+b.y)/2-rect.top
    };
  }

  function beginPan(pointer) {
    const viewport=$("rawViewport");
    state.gestureMode="pan";
    state.gestureMoved=false;
    state.panStart={
      pointerX:pointer.x,
      pointerY:pointer.y,
      scrollLeft:viewport.scrollLeft,
      scrollTop:viewport.scrollTop
    };
  }

  function beginPinch() {
    const points=[...state.pointers.values()];
    if (points.length<2) return;
    const viewport=$("rawViewport");
    const a=points[0];
    const b=points[1];
    state.gestureMode="pinch";
    state.gestureHadPinch=true;
    state.gestureMoved=true;
    state.pinchStart={
      distance:Math.max(1,pointerDistance(a,b)),
      zoom:state.zoom,
      midpoint:pointerMidpoint(a,b,viewport)
    };
  }

  function rawPointerDown(event) {
    if (!state.sourceW) return;
    const viewport=$("rawViewport");
    viewport.setPointerCapture(event.pointerId);
    state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});

    if (state.pointers.size===1) {
      state.gestureHadPinch=false;
      beginPan({x:event.clientX,y:event.clientY});
    } else if (state.pointers.size===2) {
      beginPinch();
    }
    event.preventDefault();
  }

  function rawPointerMove(event) {
    if (!state.pointers.has(event.pointerId)) return;
    state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const viewport=$("rawViewport");

    if (state.pointers.size>=2) {
      const points=[...state.pointers.values()];
      const a=points[0];
      const b=points[1];
      if (state.gestureMode!=="pinch" || !state.pinchStart) beginPinch();
      const distance=Math.max(1,pointerDistance(a,b));
      const midpoint=pointerMidpoint(a,b,viewport);
      const factor=distance/state.pinchStart.distance;
      setZoom(
        state.pinchStart.zoom*factor,
        midpoint.x,
        midpoint.y
      );
      event.preventDefault();
      return;
    }

    if (state.gestureMode==="pan" && state.panStart) {
      const p=[...state.pointers.values()][0];
      const dx=p.x-state.panStart.pointerX;
      const dy=p.y-state.panStart.pointerY;
      if (Math.hypot(dx,dy)>6) state.gestureMoved=true;
      viewport.scrollLeft=state.panStart.scrollLeft-dx;
      viewport.scrollTop=state.panStart.scrollTop-dy;
      event.preventDefault();
    }
  }

  function rawPointerEnd(event) {
    if (!state.pointers.has(event.pointerId)) return;
    const ended={x:event.clientX,y:event.clientY};
    state.pointers.delete(event.pointerId);

    if (state.gestureMode==="pan" &&
        !state.gestureMoved &&
        !state.gestureHadPinch) {
      const raw=eventToRaw(event);
      if (raw) selectRaw(raw.x,raw.y);
    }

    if (state.pointers.size===1) {
      const p=[...state.pointers.values()][0];
      beginPan(p);
      state.gestureMoved=true;
    } else if (state.pointers.size===0) {
      state.gestureMode="";
      state.panStart=null;
      state.pinchStart=null;
      state.gestureMoved=false;
      state.gestureHadPinch=false;
    }
    event.preventDefault();
  }

  async function loadRaster(file) {
    clearImage();
    setMessage("Leyendo el raster exacto sin transformar sus coordenadas…","working");
    state.file=file;
    state.fileName=file.name;
    state.fileSize=file.size || 0;
    state.mime=file.type || "";
    state.objectUrl=URL.createObjectURL(file);

    const img=$("rawImage");
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(new Error("El navegador no puede decodificar este raster como imagen."));
      img.src=state.objectUrl;
    });

    state.sourceW=img.naturalWidth || img.width;
    state.sourceH=img.naturalHeight || img.height;
    if (!state.sourceW || !state.sourceH) {
      throw new Error("No se han podido determinar las dimensiones RAW del raster.");
    }

    state.sha256=await sha256File(file);
    state.rasterKey=rasterKey();
    state.selected=null;
    state.sessionStartedAt=new Date().toISOString();

    $("rawMapHint").classList.add("hidden");
    $("rawNudgeDock").hidden=false;
    $("rawRasterMeta").textContent=
      state.fileName+" · "+state.sourceW+" × "+state.sourceH+" px · "+
      (state.fileSize ? (state.fileSize/1048576).toFixed(1)+" MB · " : "")+
      "DOMINIO="+DOMAIN;
    $("rawWidth").textContent=state.sourceW;
    $("rawHeight").textContent=state.sourceH;
    $("rawDomain").textContent=DOMAIN;
    $("rawHash").textContent=
      state.sha256==="NO_DISPONIBLE" ? "NO DISPONIBLE" : state.sha256.slice(0,16)+"…";
    setZoom(1);
    renderControls();
    if (state.campaignActive) {
      const check=campaignRasterCheck();
      renderCampaign();
      if (!check.ok) {
        setMessage(check.text,"error");
      } else {
        setMessage(check.text,check.level==="ok" ? "ok" : "working");
        if (state.campaignTargetId) goToCampaignZone();
      }
    } else {
      setMessage(
        "Raster reconocido. La captura conserva el dominio RAW original: no se aplica ninguna conversión de píxel. Amplía a 2× o 4× y toca el objeto físico.",
        "ok"
      );
    }
  }

  function eventToRaw(event) {
    const img=$("rawImage");
    const rect=img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const fx=(event.clientX-rect.left)/rect.width;
    const fy=(event.clientY-rect.top)/rect.height;
    if (fx<0 || fx>1 || fy<0 || fy>1) return null;
    return {
      x:fx*state.sourceW,
      y:fy*state.sourceH
    };
  }

  function selectRaw(x,y,origin="manual") {
    if (!state.sourceW || !state.sourceH) return;
    state.selected={
      x:Math.max(0,Math.min(state.sourceW-1,x)),
      y:Math.max(0,Math.min(state.sourceH-1,y))
    };
    state.selectionOrigin=origin;
    $("rawX").textContent=n(state.selected.x,3);
    $("rawY").textContent=n(state.selected.y,3);
    positionCrosshair();
    drawLoupe();
    if (origin==="guide") {
      setMessage("Cruceta guía aproximada. Confirma visualmente el objeto y toca o mueve la cruceta antes de registrar.","working");
    } else {
      setMessage("Píxel RAW confirmado manualmente. Verifica la cruceta roja y ajusta ±1 px si es necesario.","ok");
    }
  }

  function positionCrosshair() {
    const cross=$("rawCrosshair");
    if (!state.selected || !state.sourceW || !state.sourceH) {
      cross.hidden=true;
      return;
    }
    cross.hidden=false;
    cross.style.left=(state.selected.x/state.sourceW*100)+"%";
    cross.style.top=(state.selected.y/state.sourceH*100)+"%";
  }

  function nudge(dx,dy) {
    if (!state.selected) {
      setMessage("Selecciona primero un punto sobre el raster.","error");
      return;
    }
    selectRaw(state.selected.x+dx,state.selected.y+dy);
  }

  function drawLoupe() {
    const canvas=$("rawLoupe");
    if (!canvas) return;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#050b13";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const contextCanvas=$("rawContext");
    let contextCtx=null;
    if (contextCanvas) {
      contextCtx=contextCanvas.getContext("2d");
      contextCtx.clearRect(0,0,contextCanvas.width,contextCanvas.height);
      contextCtx.fillStyle="#050b13";
      contextCtx.fillRect(0,0,contextCanvas.width,contextCanvas.height);
    }

    if (!state.selected || !state.sourceW) return;

    const img=$("rawImage");
    const span=40;
    const half=span/2;
    const sx=Math.max(0,Math.min(state.sourceW-span,state.selected.x-half));
    const sy=Math.max(0,Math.min(state.sourceH-span,state.selected.y-half));
    const sw=Math.min(span,state.sourceW);
    const sh=Math.min(span,state.sourceH);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    ctx.strokeStyle="#ff2d2d";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2-22,canvas.height/2);
    ctx.lineTo(canvas.width/2+22,canvas.height/2);
    ctx.moveTo(canvas.width/2,canvas.height/2-22);
    ctx.lineTo(canvas.width/2,canvas.height/2+22);
    ctx.stroke();

    if (contextCanvas && contextCtx) {
      const spanX=120;
      const spanY=90;
      const csx=Math.max(
        0,
        Math.min(state.sourceW-spanX,state.selected.x-spanX/2)
      );
      const csy=Math.max(
        0,
        Math.min(state.sourceH-spanY,state.selected.y-spanY/2)
      );
      const csw=Math.min(spanX,state.sourceW);
      const csh=Math.min(spanY,state.sourceH);
      contextCtx.imageSmoothingEnabled=false;
      contextCtx.drawImage(
        img,
        csx,csy,csw,csh,
        0,0,contextCanvas.width,contextCanvas.height
      );
      contextCtx.strokeStyle="#ff2d2d";
      contextCtx.lineWidth=2;
      contextCtx.beginPath();
      contextCtx.moveTo(contextCanvas.width/2-28,contextCanvas.height/2);
      contextCtx.lineTo(contextCanvas.width/2+28,contextCanvas.height/2);
      contextCtx.moveTo(contextCanvas.width/2,contextCanvas.height/2-28);
      contextCtx.lineTo(contextCanvas.width/2,contextCanvas.height/2+28);
      contextCtx.stroke();
    }
  }

  function clearSelectionFields() {
    $("rawX").textContent="—";
    $("rawY").textContent="—";
    $("rawWidth").textContent=state.sourceW || "—";
    $("rawHeight").textContent=state.sourceH || "—";
    $("rawDomain").textContent=state.sourceW ? DOMAIN : "—";
    $("rawHash").textContent="—";
    $("rawZoom").textContent="—";
  }

  function nextControlId() {
    const count=currentControls().length+1;
    return "CF"+String(count).padStart(3,"0");
  }

  function registerControl() {
    if (!state.selected || !state.rasterKey) {
      setMessage("No hay un píxel RAW seleccionado para registrar.","error");
      return;
    }

    let target=null;
    if (state.campaignActive) {
      const spec=activeCampaign();
      const check=campaignRasterCheck();
      if (!check.ok) {
        setMessage(check.text,"error");
        return;
      }
      target=campaignTarget();
      if (!target) {
        setMessage("Selecciona un control de la campaña activa.","error");
        return;
      }
      if (spec && spec.requireManualConfirm && state.selectionOrigin==="guide") {
        setMessage("La cruceta sigue en la posición guía. Toca la presa o mueve la cruceta al menos un píxel antes de registrar.","error");
        return;
      }
      if (campaignCaptured(target.id)) {
        setMessage(target.id+" ya está capturado. Selecciona otro control.","error");
        return;
      }
    }

    const name=state.campaignActive ? target.name : $("rawControlName").value.trim();
    if (!name) {
      setMessage("Describe el objeto físico antes de registrarlo.","error");
      $("rawControlName").focus();
      return;
    }

    const control={
      at:new Date().toISOString(),
      id:state.campaignActive ? target.id : nextControlId(),
      type:state.campaignActive ? target.type : $("rawControlType").value,
      name:name,
      notes:$("rawControlNotes").value.trim(),
      raster:state.fileName,
      rasterKey:state.rasterKey,
      sha256:state.sha256,
      width:state.sourceW,
      height:state.sourceH,
      rawX:state.selected.x,
      rawY:state.selected.y,
      domain:DOMAIN,
      status:state.campaignActive ?
        "CAPTURA_RAW_PENDIENTE_REFERENCIA_IGN_PNOA" :
        "CAPTURA_RAW_PENDIENTE_REFERENCIA_OFICIAL"
    };

    if (state.campaignActive) {
      const spec=activeCampaign();
      control.campaign=spec.id;
      control.campaignTarget=target.id;
      control.zone=target.zone;
      control.captureCriterion=target.criterion;
      control.selectionOrigin=state.selectionOrigin || "manual";
      if (Number.isFinite(target.guideX) && Number.isFinite(target.guideY)) {
        control.guideRefX=target.guideX;
        control.guideRefY=target.guideY;
        control.guideX=target.guideX/spec.width*state.sourceW;
        control.guideY=target.guideY/spec.height*state.sourceH;
      }
    }

    state.controls.push(control);
    saveLocal();
    renderControls();
    $("rawControlNotes").value="";

    if (state.campaignActive) {
      state.selected=null;
      $("rawCrosshair").hidden=true;
      $("rawX").textContent="—";
      $("rawY").textContent="—";
      drawLoupe();
      selectNextCampaignTarget();
      const spec=activeCampaign();
      if (campaignControls().length===spec.targets.length) {
        setMessage("Campaña "+spec.title+" completa: "+spec.targets.length+"/"+spec.targets.length+" controles capturados. Exporta ahora la traza .txt.","ok");
      } else {
        setMessage(control.id+" capturado. Se ha activado el siguiente control; selecciona un nuevo píxel RAW.","ok");
      }
    } else {
      $("rawControlName").value="";
      setMessage(control.id+" registrado en PIXEL_RASTER_ORIGINAL. No se ha calculado ninguna coordenada geográfica.","ok");
    }
  }

  function renderControls() {
    const body=$("rawControlRows");
    body.innerHTML="";
    const controls=state.campaignActive ? campaignControls() : currentControls();
    if (!controls.length) {
      const row=document.createElement("tr");
      const cell=document.createElement("td");
      cell.colSpan=5;
      cell.className="q47-empty-table";
      cell.textContent=state.rasterKey ? "Todavía no hay controles RAW registrados para este raster." : "Carga un raster para comenzar.";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }
    controls.forEach(c=>{
      const row=document.createElement("tr");
      [c.id,c.name,c.type,n(c.rawX,3)+" / "+n(c.rawY,3),"PENDIENTE IGN/PNOA"]
        .forEach(value=>{
          const cell=document.createElement("td");
          cell.textContent=value;
          row.appendChild(cell);
        });
      body.appendChild(row);
    });
  }

  function traceText() {
    const controls=state.campaignActive ? campaignControls() : currentControls();
    const spec=state.campaignActive ? activeCampaign() : null;
    const lines=[];
    lines.push("FUGAWI_IA_CONTROL_RAW_"+VERSION.toUpperCase());
    lines.push("RAW_WEB|VERSION="+VERSION+"|BUILD="+BUILD+"|GENERADO="+new Date().toISOString());
    lines.push("RAW_SESSION|INICIO="+state.sessionStartedAt);
    lines.push("RAW_RASTER|NOMBRE="+escapeTrace(state.fileName)+"|W="+state.sourceW+"|H="+state.sourceH+"|BYTES="+state.fileSize+"|MIME="+escapeTrace(state.mime)+"|SHA256="+state.sha256);
    lines.push("RAW_DOMAIN|DOMINIO="+DOMAIN+"|ORIGEN=SUPERIOR_IZQUIERDO|X=DERECHA|Y=ABAJO|TRANSFORMACIONES_PIXEL=0");

    if (spec) {
      const campaign=controls.filter(c=>c.campaign===spec.id);
      const check=campaignRasterCheck();
      lines.push(
        "RAW_CAMPAIGN|ID="+spec.id+
        "|OBJETIVO="+spec.objective+
        "|REFERENCIA_POSTERIOR=OFICIAL_INDEPENDIENTE"+
        "|RASTER_ESPERADO="+escapeTrace(spec.rasterName)+
        "|W_ESPERADO="+spec.width+
        "|H_ESPERADO="+spec.height+
        "|SHA256_ESPERADO="+spec.sha256+
        "|GUIDE_MODE="+escapeTrace(spec.guideMode || "ZONA_APROXIMADA")+
        "|RASTER_VALIDO="+(check.ok ? "SI" : "NO")
      );
      lines.push(
        "RAW_CAMPAIGN_PROGRESS|CONTROLES="+campaign.length+
        "|TOTAL="+spec.targets.length+
        "|COMPLETA="+(campaign.length===spec.targets.length ? "SI" : "NO")
      );
    }

    controls.forEach(c=>{
      let line="RAW_CONTROL|ID="+c.id+
        "|TIPO="+escapeTrace(c.type)+
        "|NOMBRE="+escapeTrace(c.name)+
        "|PIX_X="+c.rawX+
        "|PIX_Y="+c.rawY+
        "|DOMINIO="+c.domain+
        "|ESTADO="+c.status;
      if (c.campaign) {
        line+="|CAMPANA="+escapeTrace(c.campaign)+
          "|TARGET="+escapeTrace(c.campaignTarget)+
          "|ZONA="+escapeTrace(c.zone)+
          "|CRITERIO_CAPTURA="+escapeTrace(c.captureCriterion)+
          "|SELECCION_ORIGEN="+escapeTrace(c.selectionOrigin || "manual");
        if (Number.isFinite(c.guideX) && Number.isFinite(c.guideY)) {
          line+="|GUIA_RAW_X="+c.guideX+"|GUIA_RAW_Y="+c.guideY;
        }
        if (Number.isFinite(c.guideRefX) && Number.isFinite(c.guideRefY)) {
          line+="|GUIA_REF_X="+c.guideRefX+"|GUIA_REF_Y="+c.guideRefY;
        }
      }
      if (c.notes) line+="|NOTAS="+escapeTrace(c.notes);
      lines.push(line);
    });

    lines.push(
      "RAW_RESUMEN|CONTROLES="+controls.length+
      "|COORDENADAS_OFICIALES=NO_CALCULADAS"+
      "|MALLA=NO_MODIFICADA"
    );
    return lines.join("\n")+"\n";
  }

  function downloadTrace() {
    if (!state.rasterKey) {
      setMessage("Carga primero el raster exacto.","error");
      return;
    }
    const blob=new Blob([traceText()],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    a.href=url;
    const spec=state.campaignActive ? activeCampaign() : null;
    a.download=spec ?
      spec.downloadStem+stamp+".txt" :
      "Fugawi_RAW_"+safeName(state.fileName.replace(/\.[^.]+$/, ""))+"_"+stamp+".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setMessage("Traza RAW exportada. Contiene el raster, su SHA-256 y los controles capturados.","ok");
  }

  function clearCurrentControls() {
    if (!state.rasterKey) return;
    const controls=state.campaignActive ? campaignControls() : currentControls();
    const count=controls.length;
    if (!count) return;
    const spec=state.campaignActive ? activeCampaign() : null;
    const text=spec ?
      "¿Eliminar los "+count+" controles de la campaña "+spec.title+" para este raster?" :
      "¿Eliminar los "+count+" controles RAW registrados para este raster?";
    if (!confirm(text)) return;

    if (state.campaignActive) {
      const spec=activeCampaign();
      state.controls=state.controls.filter(c=>
        !(c.rasterKey===state.rasterKey && spec && c.campaign===spec.id)
      );
    } else {
      state.controls=state.controls.filter(c=>c.rasterKey!==state.rasterKey);
    }

    saveLocal();
    renderControls();
    if (state.campaignActive) selectNextCampaignTarget();
    setMessage(
      state.campaignActive ?
        "Controles de la campaña activa eliminados." :
        "Controles RAW de este raster eliminados.",
      "ok"
    );
  }

  function newSession() {
    state.sessionStartedAt=new Date().toISOString();
    state.selected=null;
    $("rawCrosshair").hidden=true;
    if (!state.campaignActive) $("rawControlName").value="";
    $("rawControlNotes").value="";
    $("rawX").textContent="—";
    $("rawY").textContent="—";
    drawLoupe();
    if (state.campaignActive) selectNextCampaignTarget();
    setMessage("Nueva sesión RAW iniciada. Los controles ya registrados se conservan.","ok");
  }

  function openRaw() {
    $("rawValidator").hidden=false;
    $("rawValidator").scrollIntoView({behavior:"smooth",block:"start"});
    location.hash="raw";
  }

  function closeRaw() {
    $("rawValidator").hidden=true;
    if (location.hash==="#raw") {
      history.replaceState(null,"",location.pathname+location.search);
    }
  }

  function wire() {
    $("rawEntryBtn").addEventListener("click",openRaw);
    if ($("rawGranadaEntryBtn")) {
      $("rawGranadaEntryBtn").addEventListener("click",()=>{
        openRaw();
        activateGranadaCampaign();
      });
    }
    if ($("rawBarcelonaClearEntryBtn")) {
      $("rawBarcelonaClearEntryBtn").addEventListener("click",()=>{
        openRaw();
        activateBarcelonaClearCampaign();
      });
    }
    $("rawCloseBtn").addEventListener("click",closeRaw);
    $("rawRasterInput").addEventListener("change",event=>{
      const file=event.target.files && event.target.files[0];
      if (!file) return;
      loadRaster(file).catch(err=>{
        setMessage(err.message || "No se pudo cargar el raster.","error");
      });
    });
    const rawViewport=$("rawViewport");
    rawViewport.addEventListener("pointerdown",rawPointerDown);
    rawViewport.addEventListener("pointermove",rawPointerMove);
    rawViewport.addEventListener("pointerup",rawPointerEnd);
    rawViewport.addEventListener("pointercancel",rawPointerEnd);
    rawViewport.addEventListener("contextmenu",event=>event.preventDefault());
    $("rawZoom1Btn").addEventListener("click",()=>setZoom(1));
    $("rawZoom2Btn").addEventListener("click",()=>setZoom(2));
    $("rawZoom4Btn").addEventListener("click",()=>setZoom(4));
    $("rawLeftBtn").addEventListener("click",()=>nudge(-1,0));
    $("rawRightBtn").addEventListener("click",()=>nudge(1,0));
    $("rawUpBtn").addEventListener("click",()=>nudge(0,-1));
    $("rawDownBtn").addEventListener("click",()=>nudge(0,1));
    $("rawQuickLeftBtn").addEventListener("click",()=>nudge(-1,0));
    $("rawQuickRightBtn").addEventListener("click",()=>nudge(1,0));
    $("rawQuickUpBtn").addEventListener("click",()=>nudge(0,-1));
    $("rawQuickDownBtn").addEventListener("click",()=>nudge(0,1));
    $("rawQuickAcceptBtn").addEventListener("click",registerControl);
    $("rawRegisterBtn").addEventListener("click",registerControl);
    $("rawExportBtn").addEventListener("click",downloadTrace);
    $("rawCampaignExportBtn").addEventListener("click",downloadTrace);
    $("rawClearControlsBtn").addEventListener("click",clearCurrentControls);
    $("rawNewSessionBtn").addEventListener("click",newSession);
    $("rawGranadaCampaignBtn").addEventListener("click",activateGranadaCampaign);
    $("rawBarcelonaClearCampaignBtn").addEventListener("click",activateBarcelonaClearCampaign);
    $("rawCampaignGoZoneBtn").addEventListener("click",goToCampaignZone);
    $("rawCampaignExitBtn").addEventListener("click",exitCampaign);
    window.addEventListener("resize",()=>{
      if (state.sourceW) setZoom(state.zoom);
    });
  }

  if (!$("rawValidator")) return;
  wire();
  clearSelectionFields();
  renderControls();
  $("rawRuntimeBadge").textContent="RAW · v025 · PUNTOS OFICIALES IGN/PNOA";
  if (location.hash==="#raw") $("rawValidator").hidden=false;
})();
