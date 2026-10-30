
"use strict";

// Aplicación estática para GitHub Pages.
// No utiliza API Keys ni servicios de pago.
// Cada navegador guarda sus propios registros.

const STORAGE_KEY = "puerto_madero_checklists_v1";

// ==========================================
// 1. PREGUNTAS
// ==========================================

const QUESTIONS = [
  "¿Existen señalamientos turísticos visibles?",
  "¿Las calles de acceso se encuentran en buen estado?",
  "¿La zona cuenta con iluminación adecuada?",
  "¿Existen suficientes botes de basura?",
  "¿Los botes de basura se encuentran en buenas condiciones?",
  "¿La playa presenta condiciones adecuadas de limpieza?",
  "¿La playa se encuentra libre de residuos sólidos visibles?",
  "¿Existen baños públicos disponibles para los visitantes?",
  "¿Los baños públicos se encuentran limpios y funcionales?",
  "¿Existen áreas de descanso o sombra para los turistas?",
  "¿Se encuentran restaurantes o palapas en funcionamiento?",
  "¿Los establecimientos presentan condiciones adecuadas de higiene?",
  "¿Existe estacionamiento disponible para los visitantes?",
  "¿Existe transporte público accesible hacia la zona?",
  "¿Se cuenta con elementos de seguridad, como policías o salvavidas?",
  "¿Existen señalamientos de prevención y seguridad?",
  "¿Se observa presencia de turistas en la zona?",
  "¿Existen actividades recreativas o turísticas disponibles?",
  "¿La infraestructura turística se encuentra en buen estado?",
  "¿Las instalaciones reciben mantenimiento constante?"
];

const $ = id => document.getElementById(id);

let toastTimer;

// ==========================================
// 2. FECHA ACTUAL
// ==========================================

function today() {
  const d = new Date();

  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}

// ==========================================
// 3. ALMACENAMIENTO LOCAL
// ==========================================

function readRecords() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error(error);

    notify(
      "No se pudieron leer los registros almacenados.",
      true
    );

    return [];
  }
}

function writeRecords(records) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );

    return true;

  } catch (error) {
    console.error(error);

    notify(
      "No se pudieron guardar los datos en este navegador.",
      true
    );

    return false;
  }
}

// ==========================================
// 4. NOTIFICACIONES
// ==========================================

function notify(message, error = false) {
  const el = $("notificacion");

  clearTimeout(toastTimer);

  el.textContent = message;

  el.className =
    `toast show${error ? " error" : ""}`;

  toastTimer = setTimeout(() => {
    el.className = "toast";
  }, 3500);
}

// ==========================================
// 5. CREAR ELEMENTOS
// ==========================================

function element(tag, text, className = "") {
  const el = document.createElement(tag);

  el.textContent = text;

  if (className) {
    el.className = className;
  }

  return el;
}

// ==========================================
// 6. GENERAR PREGUNTAS HORIZONTALES
// ==========================================

function renderQuestions() {
  const body = $("contenedorPreguntas");

  body.replaceChildren();

  QUESTIONS.forEach((question, i) => {
    const n = i + 1;

    const tr = document.createElement("tr");

    tr.id = `row_${n}`;

    // Número de pregunta
    tr.append(
      element(
        "td",
        String(n).padStart(2, "0"),
        "number"
      )
    );

    // Texto de pregunta
    tr.append(
      element("td", question, "question")
    );

    // Respuestas Sí y No
    for (const value of ["Si", "No"]) {
      const td = element("td", "", "choice");

      const label = element(
        "label",
        "",
        "radio"
      );

      const input = document.createElement("input");

      input.type = "radio";
      input.name = `question_${n}`;
      input.value = value;
      input.required = true;

      input.setAttribute(
        "aria-label",
        `${value === "Si" ? "Sí" : "No"}: pregunta ${n}`
      );

      input.addEventListener(
        "change",
        updateProgress
      );

      label.append(
        input,
        element(
          "span",
          value === "Si" ? "Sí" : "No"
        )
      );

      td.append(label);

      tr.append(td);
    }

    // Observación opcional
    const td = document.createElement("td");

    const textarea =
      document.createElement("textarea");

    textarea.id = `observation_${n}`;

    textarea.placeholder = "Opcional...";

    textarea.setAttribute(
      "aria-label",
      `Observación de pregunta ${n}`
    );

    td.append(textarea);

    tr.append(td);

    body.append(tr);
  });
}

// ==========================================
// 7. ACTUALIZAR PROGRESO
// ==========================================

function updateProgress() {
  let yes = 0;
  let no = 0;

  QUESTIONS.forEach((_, i) => {
    const n = i + 1;

    const answer = document.querySelector(
      `input[name="question_${n}"]:checked`
    );

    const row = $(`row_${n}`);

    row.classList.toggle(
      "good",
      answer?.value === "Si"
    );

    row.classList.toggle(
      "bad",
      answer?.value === "No"
    );

    if (answer?.value === "Si") {
      yes++;
    }

    if (answer?.value === "No") {
      no++;
    }
  });

  $("respondidas").textContent =
    `${yes + no}/${QUESTIONS.length}`;

  $("favorables").textContent = yes;

  $("deficiencias").textContent = no;

  $("barraProgreso").style.width =
    `${100 * (yes + no) / QUESTIONS.length}%`;
}

// ==========================================
// 8. OBTENER RESPUESTAS
// ==========================================

function formAnswers() {
  return QUESTIONS.map((question, i) => {
    const n = i + 1;

    const selected = document.querySelector(
      `input[name="question_${n}"]:checked`
    );

    return {
      numero: n,

      pregunta: question,

      respuesta: selected
        ? (
            selected.value === "Si"
              ? "Sí"
              : "No"
          )
        : "Sin responder",

      observacion:
        $(`observation_${n}`).value.trim()
    };
  });
}

// ==========================================
// 9. COMPATIBILIDAD CON VERSIÓN ANTERIOR
// ==========================================

// La pregunta 7 antes preguntaba si
// HABÍA residuos. Ahora pregunta si NO los hay.
// Se invierte la respuesta de los registros
// antiguos para mantener el sentido positivo.

function normalizedAnswers(record) {
  const previous = Array.isArray(record.respuestas)
    ? record.respuestas
    : [];

  return QUESTIONS.map((question, i) => {
    const old = previous.find(
      item => Number(item.numero) === i + 1
    ) || previous[i] || {};

    let answer =
      old.respuesta === "Si"
        ? "Sí"
        : old.respuesta === "No"
          ? "No"
          : (old.respuesta || "Sin responder");

    if (
      i === 6 &&
      typeof old.pregunta === "string" &&
      old.pregunta.includes(
        "Se observan residuos sólidos"
      )
    ) {
      if (answer === "Sí") {
        answer = "No";
      } else if (answer === "No") {
        answer = "Sí";
      }
    }

    return {
      numero: i + 1,
      pregunta: question,
      respuesta: answer,
      observacion: old.observacion || ""
    };
  });
}

// ==========================================
// 10. LIMPIAR FORMULARIO
// ==========================================

function clearForm() {
  $("formChecklist").reset();

  $("fecha").value = today();

  updateProgress();
}

// ==========================================
// 11. GUARDAR EVALUACIÓN
// ==========================================

function saveChecklist(event) {
  event.preventDefault();

  const type =
    $("tipoNegocio").value.trim();

  const name =
    $("nombreNegocio").value.trim();

  const answers = formAnswers();

  if (
    !type ||
    !name ||
    answers.some(
      item => item.respuesta === "Sin responder"
    )
  ) {
    notify(
      "Completa los datos y responde las 20 preguntas.",
      true
    );

    return;
  }

  const record = {
    id:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

    version: 2,

    fecha: $("fecha").value,

    tipoNegocio: type,

    nombreNegocio: name,

    descripcion:
      $("descripcion").value.trim(),

    respuestas: answers,

    totalSi: answers.filter(
      a => a.respuesta === "Sí"
    ).length,

    totalNo: answers.filter(
      a => a.respuesta === "No"
    ).length,

    fechaGuardado: new Date().toISOString()
  };

  const records = readRecords();

  records.push(record);

  if (!writeRecords(records)) {
    return;
  }

  clearForm();

  renderHistory();

  notify("Evaluación guardada correctamente.");
}

// ==========================================
// 12. MOSTRAR HISTORIAL
// ==========================================

function renderHistory() {
  const records = readRecords();

  $("contadorRegistros").textContent =
    records.length;

  const container = $("listaRegistros");

  container.replaceChildren();

  if (!records.length) {
    container.append(
      element(
        "div",
        "Todavía no hay evaluaciones guardadas.",
        "empty"
      )
    );

    return;
  }

  [...records].reverse().forEach(record => {
    const answers = normalizedAnswers(record);

    const yes = answers.filter(
      a => a.respuesta === "Sí"
    ).length;

    const no = answers.filter(
      a => a.respuesta === "No"
    ).length;

    const card = element(
      "article",
      "",
      "history-item"
    );

    card.append(
      element(
        "div",
        record.tipoNegocio || "Sin tipo",
        "type"
      )
    );

    card.append(
      element(
        "strong",
        record.nombreNegocio || "Sin nombre"
      )
    );

    card.append(
      element(
        "div",
        record.fecha || "",
        "date"
      )
    );

    const chips = element(
      "div",
      "",
      "chips"
    );

    chips.append(
      element(
        "span",
        `Sí: ${yes}`,
        "chip"
      ),

      element(
        "span",
        `No: ${no}`,
        "chip no"
      )
    );

    card.append(chips);

    const details =
      document.createElement("details");

    details.append(
      element("summary", "Ver evaluación")
    );

    const content = element(
      "div",
      "",
      "details-content"
    );

    content.append(
      element(
        "p",
        `Descripción: ${
          record.descripcion || "Sin descripción"
        }`
      )
    );

    answers.forEach(a => {
      content.append(
        element(
          "p",
          `${String(a.numero).padStart(2, "0")}. ` +
          `${a.pregunta} — ${a.respuesta}` +
          `${a.observacion ? ` | ${a.observacion}` : ""}`
        )
      );
    });

    details.append(content);

    card.append(details);

    container.append(card);
  });
}

// ==========================================
// 13. ELIMINAR ÚLTIMO REGISTRO
// ==========================================

function deleteLast() {
  const records = readRecords();

  if (!records.length) {
    return notify(
      "No hay evaluaciones para eliminar.",
      true
    );
  }

  const last = records.at(-1);

  const confirmed = confirm(
    `¿Eliminar la última evaluación de "${last.nombreNegocio}"? ` +
    "Esta acción no se puede deshacer."
  );

  if (!confirmed) {
    return;
  }

  records.pop();

  if (writeRecords(records)) {
    renderHistory();

    notify("Última evaluación eliminada.");
  }
}

// ==========================================
// 14. EXPORTAR EXCEL
// ==========================================

function exportExcel() {
  const records = readRecords();

  if (!records.length) {
    return notify(
      "No hay registros para exportar.",
      true
    );
  }

  if (typeof XLSX === "undefined") {
    return notify(
      "No se cargó la librería de Excel. " +
      "Conéctate a internet e inténtalo de nuevo.",
      true
    );
  }

  try {
    // Códigos 01, 02 ... 20
    const codes = QUESTIONS.map(
      (_, i) => String(i + 1).padStart(2, "0")
    );

    // Encabezados fijos y ordenados
    const headers = [
      "N°",
      "Fecha",
      "Tipo de negocio",
      "Establecimiento",

      ...codes.map(n => `P${n}`),

      ...codes.map(n => `O${n}`),

      "Descripción general",
      "Total Sí",
      "Total No",
      "Fecha de guardado"
    ];

    const data = [headers];

    // Una fila por evaluación
    records.forEach((record, index) => {
      const answers =
        normalizedAnswers(record);

      data.push([
        index + 1,

        record.fecha || "",

        record.tipoNegocio || "",

        record.nombreNegocio || "",

        ...answers.map(a => a.respuesta),

        ...answers.map(a => a.observacion),

        record.descripcion || "",

        answers.filter(
          a => a.respuesta === "Sí"
        ).length,

        answers.filter(
          a => a.respuesta === "No"
        ).length,

        record.fechaGuardado || ""
      ]);
    });

    // Crear libro
    const book = XLSX.utils.book_new();

    // HOJA 1: EVALUACIONES
    const sheet =
      XLSX.utils.aoa_to_sheet(data);

    sheet["!cols"] = headers.map(h => ({
      wch:
        /^P\d{2}$/.test(h)
          ? 8
          : /^O\d{2}$/.test(h)
            ? 25
            : 23
    }));

    sheet["!autofilter"] = {
      ref: sheet["!ref"]
    };

    XLSX.utils.book_append_sheet(
      book,
      sheet,
      "Evaluaciones"
    );

    // HOJA 2: CATÁLOGO DE PREGUNTAS
    const dictionary =
      XLSX.utils.aoa_to_sheet([
        [
          "Código",
          "Pregunta",
          "Sí",
          "No"
        ],

        ...QUESTIONS.map((q, i) => [
          `P${codes[i]}`,
          q,
          "Favorable",
          "Desfavorable"
        ])
      ]);

    dictionary["!cols"] = [
      { wch: 12 },
      { wch: 88 },
      { wch: 18 },
      { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(
      book,
      dictionary,
      "Preguntas"
    );

    // HOJA 3: RESUMEN
    const summary =
      XLSX.utils.aoa_to_sheet([
        [
          "N°",
          "Fecha",
          "Tipo",
          "Establecimiento",
          "Favorables",
          "Deficiencias"
        ],

        ...records.map((r, i) => {
          const a = normalizedAnswers(r);

          return [
            i + 1,
            r.fecha || "",
            r.tipoNegocio || "",
            r.nombreNegocio || "",

            a.filter(
              x => x.respuesta === "Sí"
            ).length,

            a.filter(
              x => x.respuesta === "No"
            ).length
          ];
        })
      ]);

    summary["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 23 },
      { wch: 34 },
      { wch: 17 },
      { wch: 17 }
    ];

    XLSX.utils.book_append_sheet(
      book,
      summary,
      "Resumen"
    );

    // Descargar archivo Excel
    XLSX.writeFile(
      book,
      `Resurgimiento_Puerto_Madero_${today()}.xlsx`
    );

    notify("Excel generado correctamente.");

  } catch (error) {
    console.error(error);

    notify(
      "No se pudo generar el archivo Excel.",
      true
    );
  }
}

// ==========================================
// 15. EVENTOS DE LOS BOTONES
// ==========================================

$("formChecklist").addEventListener(
  "submit",
  saveChecklist
);

$("btnLimpiar").addEventListener(
  "click",
  clearForm
);

$("btnEliminar").addEventListener(
  "click",
  deleteLast
);

$("btnExcel").addEventListener(
  "click",
  exportExcel
);

// ==========================================
// 16. INICIAR APLICACIÓN
// ==========================================

$("fecha").value = today();

renderQuestions();

updateProgress();

renderHistory();
