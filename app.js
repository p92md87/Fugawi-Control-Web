(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const CONFIG_KEY = "fugawiControlConfigV003";
  const OLD_CONFIG_KEY = "fugawiControlConfigV002";
  const HISTORY_KEY = "fugawiControlHistoryV001";

  const actions = {
    regression: {
      label: "Corregir regresión",
      nextTitle: "Describe la regresión",
      nextText: "Indica qué comportamiento ha empeorado y, si la conoces, cuál fue la última versión correcta.",
      prompt: "Corrige esta regresión. Identifica primero la última versión correcta y compara únicamente los bloques afectados. Recupera sólo lo necesario y no alteres la arquitectura aprobada."
    },
    improvement: {
      label: "Añadir mejora",
      nextTitle: "Describe la mejora",
      nextText: "Explica qué nueva capacidad necesitas y qué comportamiento existente debe conservarse.",
      prompt: "Añade esta mejora a Fugawi manteniendo la arquitectura aprobada y el comportamiento existente que no esté relacionado con el cambio. Identifica alcance, riesgos y pruebas necesarias."
    },
    refactor: {
      label: "Reestructurar código",
      nextTitle: "Indica qué quieres reestructurar",
      nextText: "Se preservará el comportamiento observable y se bloquearán cambios arquitectónicos no aprobados.",
      prompt: "Reestructura este bloque manteniendo exactamente el comportamiento observable y la arquitectura aprobada. Elimina duplicaciones si procede y audita posibles colisiones de identificadores."
    },
    compare: {
      label: "Comparar versiones",
      nextTitle: "Indica las versiones a comparar",
      nextText: "Puedes especificar una referencia correcta o dejar que la IA localice la última versión válida.",
      prompt: "Compara la versión operativa con la referencia indicada. Limita el análisis a los bloques modificados, identifica diferencias funcionales y señala cualquier regresión."
    },
    next: {
      label: "Generar nueva versión",
      nextTitle: "Describe el cambio de la nueva versión",
      nextText: "La orden incluirá numeración correlativa, trazabilidad y pruebas antes de integrar.",
      prompt: "Genera la siguiente versión correlativa a partir de la versión operativa. Mantén la arquitectura aprobada y registra de forma explícita los cambios realizados."
    },
    tests: {
      label: "Añadir / ejecutar pruebas",
      nextTitle: "Describe qué debe verificarse",
      nextText: "Define el comportamiento que quieres proteger frente a futuras regresiones.",
      prompt: "Añade o ejecuta pruebas que cubran este comportamiento sin modificar la lógica operativa existente. Documenta qué verifican, criterios de éxito y regresiones detectables."
    }
  };

  const examples = {
    border: {
      action: "regression",
      text: "El borde inferior de la malla vuelve a invadir la zona blanca. Localiza la última versión en la que quedaba ajustado al límite útil, compara sólo los bloques responsables y recupera únicamente la lógica necesaria."
    },
    syntax: {
      action: "regression",
      text: "Corrige el error de sintaxis observado y audita el resto del programa para localizar sentencias del mismo tipo. No modifiques la arquitectura ni bloques no relacionados."
    },
    grid: {
      action: "improvement",
      text: "Integra la submalla de forma experimental, manteniendo separadas la topología y la capa métrica. No la conviertas en operativa sin evidencia suficiente y pruebas de continuidad."
    }
  };

  let selectedAction = null;

  function config() {
    return {
      owner: $("repoOwner").value.trim(),
      repo: $("repoName").value.trim(),
      branch: $("baseBranch").value.trim() || "main",
      mode: $("workMode").value,
      current: $("currentVersion").value.trim(),
      certified: $("certifiedVersion").value.trim()
    };
  }

  function saveConfig() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config()));
    setResultStatus("Configuración guardada");
    updateProjectStatus();
  }

  function loadConfig() {
    let raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) raw = localStorage.getItem(OLD_CONFIG_KEY);
    if (!raw) return;

    try {
      const c = JSON.parse(raw);
      $("repoOwner").value = c.owner || "p92md87";
      $("repoName").value = c.repo || "Fugawi";
      $("baseBranch").value = c.branch || "main";
      $("workMode").value = c.mode || "experimental";
      const cm = String(c.current || "").match(/P3N[_-]?(\d{3})/i);
      const oldCurrent = cm ? Number(cm[1]) : 0;
      $("currentVersion").value = oldCurrent >= 42 ? c.current : "Fugawi_P3N_042_Q47_auditoria_runtime_fix.txt";
      $("certifiedVersion").value = c.certified || $("certifiedVersion").value;
    } catch (_) {}
  }

  function versionLabel(text) {
    const m = String(text || "").match(/P3N[_-]?(\d{3})/i);
    return m ? "P3N_" + m[1] : "SIN DEFINIR";
  }

  function nextVersion(text) {
    const matches = [...String(text || "").matchAll(/P3N[_-]?(\d{3})/gi)];
    if (!matches.length) return "P3N_???";
    const n = Number(matches[matches.length - 1][1]) + 1;
    return "P3N_" + String(n).padStart(3, "0");
  }

  function modeLabel(mode) {
    if (mode === "analysis") return "ANÁLISIS";
    if (mode === "operational") return "OPERATIVO";
    return "EXPERIMENTAL";
  }

  function modeInstruction(mode) {
    if (mode === "analysis") return "ANÁLISIS: no modificar archivos, ramas ni commits.";
    if (mode === "operational") return "OPERATIVO: cualquier integración requiere aprobación explícita y evidencia suficiente.";
    return "EXPERIMENTAL: se permiten análisis, ramas, archivos, trazas y pruebas; no integrar automáticamente.";
  }

  function updateProjectStatus() {
    const c = config();
    $("statusCurrent").textContent = versionLabel(c.current);
    $("statusNext").textContent = nextVersion(c.current);
    $("statusMode").textContent = modeLabel(c.mode);
  }

  function setAction(key, focusTask = true) {
    if (!actions[key]) return;
    selectedAction = key;

    document.querySelectorAll(".action-card").forEach(card => {
      const active = card.dataset.action === key;
      card.classList.toggle("selected", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const a = actions[key];
    $("selectedActionPill").textContent = a.label;
    $("selectedActionPill").classList.add("active");
    $("nextStepTitle").textContent = a.nextTitle;
    $("nextStepText").textContent = a.nextText;

    if (!$("taskText").value.trim()) $("taskText").value = a.prompt;

    setFlow(2);
    setGuide(2);

    if (focusTask) {
      $("workbench").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("taskText").focus(), 250);
    }
  }

  function setFlow(step) {
    for (let i = 1; i <= 4; i++) {
      const el = $("flow" + i);
      el.classList.remove("active", "done");
      if (i < step) el.classList.add("done");
      if (i === step) el.classList.add("active");
    }
  }

  function setGuide(step) {
    const items = [...$("guideList").querySelectorAll("li")];
    items.forEach((li, index) => {
      const n = index + 1;
      li.classList.remove("done", "current");
      if (n < step) li.classList.add("done");
      if (n === step) li.classList.add("current");
    });
  }

  function selectedControls() {
    const controls = [];
    if ($("chkArchitecture").checked) controls.push("No alterar la arquitectura aprobada.");
    if ($("chkRegression").checked) controls.push("Comparar únicamente los bloques afectados y recuperar sólo lo necesario.");
    if ($("chkSyntax").checked) controls.push("Auditar sintaxis Smart BASIC y colisiones entre escalares, arrays, funciones y subrutinas.");
    if ($("chkTrace").checked) controls.push("Toda creación o actualización de archivos críticos debe confirmarse y registrar la ruta exacta.");
    if ($("chkTests").checked) controls.push("Ejecutar las pruebas disponibles antes de proponer integración; no validar sólo por visualización o ausencia de errores.");
    return controls;
  }

  function updateGuardCount() {
    const ids = ["chkArchitecture", "chkRegression", "chkSyntax", "chkTrace", "chkTests"];
    const active = ids.filter(id => $(id).checked).length;
    $("guardCount").textContent = active + "/5";
  }

  function buildTask() {
    if (!selectedAction) {
      alert("Selecciona primero qué quieres hacer con Fugawi.");
      $("actionGrid").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const c = config();
    const request = $("taskText").value.trim();
    if (!request) {
      alert("Describe primero lo que necesitas.");
      $("taskText").focus();
      return;
    }

    const scope = $("targetScope").value.trim();
    const reference = $("referenceVersion").value.trim();
    const controls = selectedControls();
    const next = nextVersion(c.current);

    const lines = [
      "PROYECTO: FUGAWI",
      "ACCIÓN: " + actions[selectedAction].label,
      "MODO: " + modeInstruction(c.mode),
      "",
      "REPOSITORIO:",
      "- Propietario: " + (c.owner || "[sin configurar]"),
      "- Repositorio privado: " + (c.repo || "[sin configurar]"),
      "- Rama base: " + c.branch,
      "",
      "VERSIONES:",
      "- Versión operativa: " + (c.current || "[sin indicar]"),
      "- Última certificada: " + (c.certified || "[sin indicar]"),
      "- Siguiente versión prevista: " + next,
      reference ? "- Referencia correcta indicada: " + reference : null,
      scope ? "- Archivo/bloque afectado: " + scope : null,
      "",
      "SOLICITUD:",
      request,
      "",
      "DIRECTRIZ ESPECÍFICA:",
      actions[selectedAction].prompt,
      "",
      "CONTROLES OBLIGATORIOS:",
      ...(controls.length ? controls.map(x => "- " + x) : ["- Ninguna protección opcional seleccionada."]),
      "",
      "REGLAS DE ENTREGA:",
      "- Explicar causa, alcance y consecuencias de cualquier cambio estructural.",
      "- No integrar cambios arquitectónicos sin aprobación explícita.",
      "- Mantener la numeración correlativa de versiones.",
      "- Identificar todos los archivos modificados.",
      "- Resumir pruebas ejecutadas, resultado y limitaciones.",
      "- Si se crea o modifica un archivo crítico, confirmar la ruta exacta.",
      "- Preparar diff/commit/PR sólo cuando el modo y la evidencia lo permitan.",
      "",
      "CIERRE:",
      "- Si la evidencia es insuficiente o el cambio exige alterar arquitectura, detener la integración y dejarlo explícito."
    ].filter(x => x !== null);

    $("generatedTask").textContent = lines.join("\n");
    $("generatedTask").classList.remove("hidden");
    $("emptyResult").classList.add("hidden");
    $("resultActions").classList.remove("hidden");
    setResultStatus("Lista para enviar");
    setFlow(4);
    setGuide(4);
    $("nextStepTitle").textContent = "Orden preparada";
    $("nextStepText").textContent = "Revísala y usa “Compartir / enviar” para llevarla a ChatGPT. La ejecución directa sobre GitHub llegará en la siguiente fase.";
    $("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setResultStatus(text) {
    $("statusText").textContent = text;
  }

  async function copyTask() {
    const text = $("generatedTask").textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setResultStatus("Copiada al portapapeles");
  }

  async function shareTask() {
    const text = $("generatedTask").textContent;
    if (navigator.share) {
      await navigator.share({ title: "Orden Fugawi", text });
      setResultStatus("Enviada a compartir");
      setGuide(5);
      return;
    }
    await copyTask();
    alert("La orden se ha copiado. Abre ChatGPT y pégala en el chat.");
  }

  function openUrl(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function repoUrl(suffix = "") {
    const c = config();
    if (!c.owner || !c.repo) {
      alert("Configura primero propietario y repositorio.");
      return null;
    }
    return "https://github.com/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + suffix;
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function history() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }

  function saveTaskToHistory() {
    const text = $("generatedTask").textContent;
    if (!text) return;

    const h = history();
    h.unshift({
      at: new Date().toISOString(),
      action: selectedAction ? actions[selectedAction].label : "Orden",
      version: config().current,
      mode: config().mode,
      task: text
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
    renderHistory();
    setResultStatus("Guardada en historial");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderHistory() {
    const h = history();
    const node = $("history");
    node.innerHTML = "";

    if (!h.length) {
      node.className = "history empty";
      node.textContent = "Todavía no hay órdenes guardadas.";
      return;
    }

    node.className = "history";
    h.slice(0, 4).forEach(item => {
      const wrap = document.createElement("div");
      wrap.className = "history-item";

      const meta = document.createElement("div");
      meta.className = "meta";
      const label = item.action || item.mode || "Orden";
      meta.innerHTML =
        "<span>" + escapeHtml(label) + " · " + escapeHtml(versionLabel(item.version)) + "</span>" +
        "<span>" + escapeHtml(new Date(item.at).toLocaleString()) + "</span>";

      const pre = document.createElement("pre");
      pre.textContent = item.task;
      wrap.append(meta, pre);
      node.appendChild(wrap);
    });
  }

  document.querySelectorAll(".action-card").forEach(card => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => setAction(card.dataset.action));
  });

  document.querySelectorAll("[data-example]").forEach(button => {
    button.addEventListener("click", () => {
      const ex = examples[button.dataset.example];
      if (!ex) return;
      setAction(ex.action, false);
      $("taskText").value = ex.text;
      $("taskText").focus();
      setFlow(2);
      setGuide(2);
    });
  });

  ["chkArchitecture", "chkRegression", "chkSyntax", "chkTrace", "chkTests"].forEach(id => {
    $(id).addEventListener("change", updateGuardCount);
  });

  $("taskText").addEventListener("input", () => {
    if (selectedAction && $("taskText").value.trim()) {
      setFlow(3);
      setGuide(3);
      $("nextStepTitle").textContent = "Revisa las protecciones";
      $("nextStepText").textContent = "Comprueba las reglas activas y después genera la orden para IA.";
    }
  });

  $("saveConfigBtn").addEventListener("click", saveConfig);
  $("workMode").addEventListener("change", updateProjectStatus);
  $("currentVersion").addEventListener("input", updateProjectStatus);

  $("buildBtn").addEventListener("click", buildTask);
  $("copyBtn").addEventListener("click", () => copyTask().catch(() => alert("No se pudo copiar la orden.")));
  $("shareBtn").addEventListener("click", () => shareTask().catch(() => {}));
  $("openChatGPTBtn").addEventListener("click", () => openUrl("https://chatgpt.com/"));
  $("saveTaskBtn").addEventListener("click", saveTaskToHistory);

  $("exportTaskBtn").addEventListener("click", () => {
    download(
      "Orden_Fugawi_" + nextVersion(config().current) + ".txt",
      $("generatedTask").textContent,
      "text/plain;charset=utf-8"
    );
  });

  $("exportHistoryBtn").addEventListener("click", () => {
    download(
      "Historial_Fugawi_Control_v003.json",
      JSON.stringify(history(), null, 2),
      "application/json;charset=utf-8"
    );
  });

  $("clearHistoryBtn").addEventListener("click", () => {
    if (!confirm("¿Vaciar el historial local de órdenes?")) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  const openRepo = () => {
    const url = repoUrl();
    if (url) openUrl(url);
  };
  $("openRepoBtn").addEventListener("click", openRepo);
  $("openRepoTopBtn").addEventListener("click", openRepo);
  $("openActionsBtn").addEventListener("click", () => {
    const url = repoUrl("/actions");
    if (url) openUrl(url);
  });

  loadConfig();
  updateProjectStatus();
  updateGuardCount();
  renderHistory();
  setFlow(1);
  setGuide(1);

  async function refreshFugawiWebAssets() {
    if ("caches" in window) {
      try {
        const keys=await caches.keys();
        await Promise.all(
          keys
            .filter(key=>key.startsWith("fugawi-control-") &&
              key!=="fugawi-control-v003-r3")
            .map(key=>caches.delete(key))
        );
      } catch (_) {}
    }

    if ("serviceWorker" in navigator &&
        (location.protocol === "https:" || location.hostname === "localhost")) {
      try {
        const registration=await navigator.serviceWorker.register(
          "./service-worker.js?v=003-r3",
          {updateViaCache:"none"}
        );
        await registration.update();
      } catch (_) {}
    }
  }

  refreshFugawiWebAssets();
})();