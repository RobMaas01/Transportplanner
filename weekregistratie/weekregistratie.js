import { createClient } from "@supabase/supabase-js";
import {
  ALL_LOCATIONS,
  CODERDOJO_LOCATIONS,
  CUSTOM_OPTION,
  KNOWN_TASKS,
  LEGACY_CUSTOM_OPTION,
  OLD_STORAGE_KEYS,
  STATE_ID,
  STORAGE_KEY,
  TIME_TASKS,
} from "./gegevens.js";

// Centrale instellingen en opslag.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-project") &&
  supabaseAnonKey !== "your-anon-key";
const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Elementen uit de pagina.
const homeView = document.querySelector("#homeView");
const appView = document.querySelector("#appView");
const homeButton = document.querySelector("#homeButton");
const helpButton = document.querySelector("#helpButton");
const closeHelpButton = document.querySelector("#closeHelpButton");
const helpModal = document.querySelector("#helpModal");
const logoutButton = document.querySelector("#logoutButton");
const pageTitle = document.querySelector("#pageTitle");
const selectedPeriodLabel = document.querySelector("#selectedPeriodLabel");

const registrationView = document.querySelector("#registrationView");
const reportView = document.querySelector("#reportView");
const taskForm = document.querySelector("#taskForm");
const taskList = document.querySelector("#taskList");
const archiveDetails = document.querySelector("#archiveDetails");
const archiveList = document.querySelector("#archiveList");
const taskCountLabel = document.querySelector("#taskCountLabel");
const reportCountLabel = document.querySelector("#reportCountLabel");
const storageStatus = document.querySelector("#storageStatus");
const exportButton = document.querySelector("#exportButton");
const showReportButton = document.querySelector("#showReportButton");
const reportResults = document.querySelector("#reportResults");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const saveMessage = document.querySelector("#saveMessage");
const todayButton = document.querySelector("#todayButton");

// Formuliergroepen en invoervelden.
const periodRadios = document.querySelectorAll('input[name="periodType"]');
const reportRadios = document.querySelectorAll('input[name="reportType"]');
const weekField = document.querySelector("#weekField");
const dateField = document.querySelector("#dateField");
const reportWeekField = document.querySelector("#reportWeekField");
const reportMonthField = document.querySelector("#reportMonthField");
const reportYearField = document.querySelector("#reportYearField");
const customTaskField = document.querySelector("#customTaskField");
const locationFields = document.querySelector("#locationFields");
const fromField = document.querySelector("#fromField");
const toField = document.querySelector("#toField");
const fromLabel = document.querySelector("#fromLabel");
const toLabel = document.querySelector("#toLabel");
const amountField = document.querySelector("#amountField");
const timeField = document.querySelector("#timeField");
const descriptionField = document.querySelector("#descriptionField");
const descriptionLabel = document.querySelector("#descriptionLabel");
const noteField = document.querySelector("#noteField");

const inputs = {
  week: document.querySelector("#weekInput"),
  date: document.querySelector("#dateInput"),
  reportWeek: document.querySelector("#reportWeekInput"),
  reportMonth: document.querySelector("#reportMonthInput"),
  reportYear: document.querySelector("#reportYearInput"),
  type: document.querySelector("#typeInput"),
  customTask: document.querySelector("#customTaskInput"),
  from: document.querySelector("#fromInput"),
  to: document.querySelector("#toInput"),
  customFrom: document.querySelector("#customFromInput"),
  customTo: document.querySelector("#customToInput"),
  amount: document.querySelector("#amountInput"),
  time: document.querySelector("#timeInput"),
  description: document.querySelector("#descriptionInput"),
  note: document.querySelector("#noteInput"),
};

const stats = {
  tasks: document.querySelector("#statTasks"),
  locations: document.querySelector("#statLocations"),
  time: document.querySelector("#statTime"),
  typeReport: document.querySelector("#typeReport"),
  locationReport: document.querySelector("#locationReport"),
};

let state = loadState();
let currentView = "registratie";
let editingTaskId = null;
let reportVisible = false;
let centralStateLoaded = false;
let centralSaveTimer = null;

// Opslag: lokaal als backup, Supabase als centrale bron.
function newSessionId() {
  return `sessie-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current?.tasks) return ensureState(current);

    for (const key of OLD_STORAGE_KEYS) {
      const old = JSON.parse(localStorage.getItem(key));
      if (old?.tasks) return ensureState(old);
    }
  } catch {
    // Lege start als localStorage niet leesbaar is.
  }
  return { tasks: [], currentSessionId: newSessionId() };
}

function ensureState(raw) {
  const sessionId = raw.currentSessionId || newSessionId();
  return {
    tasks: (raw.tasks || []).map((task) => ({
      time: "",
      ...task,
      type: task.type === "Extra kratten" ? "Extra kratten ophalen" : task.type,
      sessionId: task.sessionId || sessionId,
    })),
    currentSessionId: sessionId,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueCentralSave();
}

function setStorageStatus(message) {
  storageStatus.textContent = message;
}

async function loadCentralState() {
  if (!supabaseConfigured) {
    setStorageStatus("Lokale opslag");
    centralStateLoaded = true;
    return;
  }

  setStorageStatus("Centrale opslag laden...");
  const { data, error } = await supabase
    .from("weekregistratie_state")
    .select("data, updated_at")
    .eq("id", STATE_ID)
    .single();

  if (error) {
    console.error("Weekregistratie centrale opslag laden mislukt.", error);
    setStorageStatus("Lokale opslag");
    centralStateLoaded = true;
    return;
  }

  const centralState = ensureState(data?.data || {});
  if (centralState.tasks.length > 0 || state.tasks.length === 0) {
    state = centralState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    await saveCentralStateNow();
  }

  centralStateLoaded = true;
  setStorageStatus("Centrale opslag actief");
  render();
}

function queueCentralSave() {
  if (!supabaseConfigured || !centralStateLoaded) return;
  window.clearTimeout(centralSaveTimer);
  centralSaveTimer = window.setTimeout(saveCentralStateNow, 500);
}

async function saveCentralStateNow() {
  if (!supabaseConfigured) return;

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("weekregistratie_state").upsert({
    id: STATE_ID,
    data: state,
    updated_at: updatedAt,
  });

  if (error) {
    console.error("Weekregistratie centrale opslag bewaren mislukt.", error);
    setStorageStatus("Opslaan lokaal");
    return;
  }

  setStorageStatus("Centrale opslag actief");
}

// Datum- en periodehelpers.
function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function currentYearValue() {
  return String(new Date().getFullYear());
}

function getCurrentWeekValue(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function weekFromDate(dateValue) {
  if (!dateValue) return getCurrentWeekValue();
  return getCurrentWeekValue(new Date(`${dateValue}T12:00:00`));
}

function weekToMonth(weekValue) {
  if (!weekValue) return currentMonthValue();
  const [year, weekPart] = weekValue.split("-W");
  const week = Number(weekPart);
  const janFourth = new Date(Date.UTC(Number(year), 0, 4));
  const janFourthDay = janFourth.getUTCDay() || 7;
  const monday = new Date(janFourth);
  monday.setUTCDate(janFourth.getUTCDate() - janFourthDay + 1 + (week - 1) * 7);
  return monday.toISOString().slice(0, 7);
}

function selectedPeriodType() {
  return document.querySelector('input[name="periodType"]:checked').value;
}

function selectedReportType() {
  return document.querySelector('input[name="reportType"]:checked').value;
}

// Filters voor registratie, archief en rapportage.
function getActiveFilter() {
  if (currentView === "rapportage") {
    const type = selectedReportType();
    return {
      type,
      week: inputs.reportWeek.value,
      month: inputs.reportMonth.value,
      year: inputs.reportYear.value,
    };
  }

  const type = selectedPeriodType();
  return {
    type,
    week: type === "week" ? inputs.week.value : weekFromDate(inputs.date.value),
    date: type === "day" ? inputs.date.value : "",
    month: type === "day" ? inputs.date.value.slice(0, 7) : weekToMonth(inputs.week.value),
    year: type === "day" ? inputs.date.value.slice(0, 4) : inputs.week.value.slice(0, 4),
  };
}

function matchesFilter(task, filter) {
  if (filter.type === "day") return task.date === filter.date;
  if (filter.type === "month" && !task.month && task.week) return weekToMonth(task.week) === filter.month;
  if (filter.type === "year" && !task.year && task.week) return task.week.slice(0, 4) === filter.year;
  if (filter.type === "month") return task.month === filter.month;
  if (filter.type === "year") return task.year === filter.year;
  return task.week === filter.week;
}

function getFilteredTasks({ includeArchive = false } = {}) {
  const filter = getActiveFilter();
  return state.tasks
    .filter((task) => matchesFilter(task, filter))
    .filter((task) => includeArchive || currentView === "rapportage" || task.sessionId === state.currentSessionId)
    .sort((a, b) => `${a.date || ""}${a.createdAt}`.localeCompare(`${b.date || ""}${b.createdAt}`));
}

function getArchivedTasks() {
  return state.tasks
    .filter((task) => task.sessionId !== state.currentSessionId)
    .sort((a, b) => `${a.date || ""}${a.createdAt}`.localeCompare(`${b.date || ""}${b.createdAt}`));
}

function getCurrentLoginTasks() {
  return state.tasks
    .filter((task) => task.sessionId === state.currentSessionId)
    .sort((a, b) => `${a.createdAt}`.localeCompare(`${b.createdAt}`));
}

// Labels voor weken, dagen, maanden en jaren.
function formatWeekLabel(value) {
  if (!value) return "Geen week gekozen";
  const [year, week] = value.split("-W");
  const { start, end } = weekDateRange(value);
  return `Week ${Number(week)} van ${year} (${formatShortDate(start)}-${formatShortDate(end)})`;
}

function weekDateRange(value) {
  const [year, weekPart] = value.split("-W");
  const week = Number(weekPart);
  const janFourth = new Date(Date.UTC(Number(year), 0, 4));
  const janFourthDay = janFourth.getUTCDay() || 7;
  const start = new Date(janFourth);
  start.setUTCDate(janFourth.getUTCDate() - janFourthDay + 1 + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 4);
  return { start, end };
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function formatDateLabel(value) {
  if (!value) return "Geen dag gekozen";
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatMonthLabel(value) {
  if (!value) return "Geen maand gekozen";
  return new Intl.DateTimeFormat("nl-NL", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T12:00:00`));
}

function filterLabel() {
  const filter = getActiveFilter();
  if (filter.type === "day") return formatDateLabel(filter.date);
  if (filter.type === "month") return formatMonthLabel(filter.month);
  if (filter.type === "year") return `Jaar ${filter.year}`;
  return formatWeekLabel(filter.week);
}

// Schermwissels en formulierweergave.
function openApp(view) {
  homeView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  setView(view);
}

function setView(view) {
  currentView = view;
  const isReport = view === "rapportage";
  registrationView.classList.toggle("is-hidden", isReport);
  reportView.classList.toggle("is-hidden", !isReport);
  pageTitle.textContent = isReport ? "Rapportage" : editingTaskId ? "Taak wijzigen" : "Taak toevoegen";
  render();
}

function syncPeriodControls() {
  const type = selectedPeriodType();
  weekField.classList.toggle("is-hidden", type !== "week");
  dateField.classList.toggle("is-hidden", type !== "day");
}

function syncReportControls() {
  const type = selectedReportType();
  reportWeekField.classList.toggle("is-hidden", type !== "week");
  reportMonthField.classList.toggle("is-hidden", type !== "month");
  reportYearField.classList.toggle("is-hidden", type !== "year");
}

function fillLocationSelect(select, locations) {
  const current = select.value;
  select.innerHTML = '<option value="">Kies vestiging</option>';
  [...locations, CUSTOM_OPTION].forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    select.append(option);
  });
  select.value = [...locations, CUSTOM_OPTION, LEGACY_CUSTOM_OPTION].includes(current)
    ? current === LEGACY_CUSTOM_OPTION
      ? CUSTOM_OPTION
      : current
    : "";
}

function setSelectValue(select, value, customInput) {
  if (!value) {
    select.value = "";
    customInput.value = "";
    return;
  }
  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
    customInput.value = "";
  } else {
    select.value = CUSTOM_OPTION;
    customInput.value = value;
  }
}

function selectedLocation(select, customInput) {
  if (select.value === CUSTOM_OPTION || select.value === LEGACY_CUSTOM_OPTION) return customInput.value.trim();
  return select.value;
}

function syncLocationCustomInputs() {
  inputs.customFrom.classList.toggle("is-hidden", inputs.from.value !== CUSTOM_OPTION);
  inputs.customTo.classList.toggle("is-hidden", inputs.to.value !== CUSTOM_OPTION);
  inputs.customFrom.required = inputs.from.value === CUSTOM_OPTION;
  inputs.customTo.required = inputs.to.value === CUSTOM_OPTION;
}

// Taaktype bepaalt welke velden zichtbaar en verplicht zijn.
function syncTaskFields({ keepValues = false } = {}) {
  const task = inputs.type.value;
  const isPlukker = task === "Plukker";
  const isEelan = task === "Eelan";
  const isMeubel = task === "Meubel verplaatsen";
  const isExtraSorteren = task === "Extra sorteerwerk";
  const isExtraKratten = task === "Extra kratten ophalen";
  const isStort = task === "Stort";
  const isGarage = task === "Garage";
  const isCoderDojo = task === "CoderDojo";
  const isOverig = task === CUSTOM_OPTION || task === LEGACY_CUSTOM_OPTION;
  const usesSingleLocation = isExtraSorteren || isExtraKratten;
  const usesTime = TIME_TASKS.includes(task);
  const previousFrom = inputs.from.value;
  const previousTo = inputs.to.value;

  customTaskField.classList.toggle("is-hidden", !isOverig);
  inputs.customTask.required = isOverig;
  locationFields.classList.toggle("is-hidden", isGarage);
  locationFields.classList.toggle("single-col", isPlukker || isEelan || usesSingleLocation || isStort);
  fromField.classList.toggle("is-hidden", isPlukker || isEelan || usesSingleLocation || isOverig);
  toField.classList.toggle("is-hidden", isGarage || isOverig || isStort);
  amountField.classList.toggle("is-hidden", !task || isGarage || isCoderDojo || isMeubel || isStort);
  timeField.classList.toggle("is-hidden", !usesTime);
  descriptionField.classList.toggle("is-hidden", !task || isPlukker || isEelan || isExtraSorteren || isExtraKratten || isCoderDojo || isOverig);
  noteField.classList.toggle("is-hidden", isMeubel || isOverig);
  inputs.amount.required = Boolean(task) && !(isGarage || isCoderDojo || isMeubel || isOverig || isEelan || isStort);
  inputs.time.required = isExtraSorteren;
  inputs.description.required = false;
  inputs.from.required = isStort;
  inputs.to.required = isCoderDojo || isPlukker || isEelan || isExtraSorteren;
  fromLabel.textContent = "Van";
  toLabel.textContent = usesSingleLocation ? "Bij vestiging" : "Naar";
  descriptionLabel.textContent = isGarage ? "Reden" : "Omschrijving";

  fillLocationSelect(inputs.from, isCoderDojo ? CODERDOJO_LOCATIONS : ALL_LOCATIONS);
  fillLocationSelect(inputs.to, isCoderDojo ? CODERDOJO_LOCATIONS : ALL_LOCATIONS);

  if (keepValues) {
    inputs.from.value = previousFrom;
    inputs.to.value = previousTo;
  }

  if (isPlukker) {
    inputs.from.value = "";
    if (!editingTaskId) inputs.to.value = "Bibliotheek School 7";
  }

  if (isEelan) {
    inputs.from.value = "Eelan";
    if (!editingTaskId) inputs.to.value = "Bibliotheek School 7";
  }

  if (isMeubel && !editingTaskId) {
    inputs.from.value = "";
    inputs.to.value = "";
  }

  if (isStort && !editingTaskId) {
    inputs.to.value = "";
    inputs.customTo.value = "";
  }

  if (usesSingleLocation) {
    inputs.from.value = "";
    inputs.customFrom.value = "";
    if (isExtraSorteren && !editingTaskId) inputs.to.value = "Bibliotheek Tuitjenhorn";
    if (isExtraKratten && !editingTaskId) inputs.to.value = "";
  }

  if (isGarage || isOverig) {
    inputs.from.value = "";
    inputs.to.value = "";
    inputs.customFrom.value = "";
    inputs.customTo.value = "";
  }

  if (isCoderDojo) {
    inputs.amount.value = 15;
    if (!editingTaskId) {
      inputs.from.value = "";
      inputs.to.value = "";
      inputs.customFrom.value = "";
      inputs.customTo.value = "";
    }
  }

  if (task && !isCoderDojo && !editingTaskId) inputs.amount.value = "";
  if (isOverig && !editingTaskId) {
    inputs.description.value = "";
    inputs.note.value = "";
  }
  if (usesTime && !editingTaskId) inputs.time.value = "";
  inputs.note.placeholder = isGarage ? "Type afspraak of bijzonderheden" : "Bijzonderheden of afspraak";
  syncLocationCustomInputs();
}

function syncTaskFieldsWithoutJump() {
  const scrollY = window.scrollY;
  syncTaskFields();
  requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

// Renderen van taken, archief en rapportage.
function render() {
  const tasks = getCurrentLoginTasks();
  const archived = currentView === "registratie" ? getArchivedTasks() : [];
  selectedPeriodLabel.textContent = filterLabel();
  taskCountLabel.textContent = `${tasks.length} ${tasks.length === 1 ? "taak" : "taken"}`;
  reportCountLabel.textContent = `${getFilteredTasks({ includeArchive: true }).length} taken`;
  renderTasks(taskList, tasks, { editable: true });
  renderArchive(archiveList, archived);
  archiveDetails.classList.toggle("is-hidden", archived.length === 0);
  reportResults.classList.toggle("is-hidden", !reportVisible);
  if (reportVisible) renderReport(getFilteredTasks({ includeArchive: true }));
}

function hideReportResults() {
  reportVisible = false;
  render();
}

function showReportResults() {
  reportVisible = true;
  render();
}

function renderTasks(container, tasks, options = {}) {
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">Nog geen taken voor deze periode.</div>';
    return;
  }

  container.innerHTML = tasks
    .map(
      (task) => `
        <article class="task-card${options.archived ? " archived" : ""}">
          <div>
            <strong>${escapeHtml(task.type)}</strong>
            <div class="task-meta">
              <span class="pill">${periodTypeLabel(task.periodType)}</span>
              <span>${escapeHtml(taskPeriodLabel(task))}</span>
              ${formatRoute(task) ? `<span>${escapeHtml(formatRoute(task))}</span>` : ""}
              ${task.type === "CoderDojo" ? `<span>Aantal kratten: ${task.amount || 15}</span>` : task.amount ? `<span>Aantal: ${task.amount}</span>` : ""}
              ${task.time ? `<span>Tijd: ${task.time} min</span>` : ""}
            </div>
            ${task.description ? `<p class="task-note">${escapeHtml(task.description)}</p>` : ""}
            ${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}
          </div>
          <div class="task-actions">
            <button class="edit-button" type="button" data-edit="${task.id}">Wijzig</button>
            <button class="delete-button" type="button" data-delete="${task.id}">Verwijder</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderArchive(container, tasks) {
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">Nog geen taken in het archief.</div>';
    return;
  }

  container.innerHTML = Object.entries(groupTasksByMonth(tasks))
    .map(
      ([month, monthTasks]) => `
        <details class="archive-month">
          <summary>
            <span>${escapeHtml(formatMonthLabel(month))}</span>
            <strong>${monthTasks.length} ${monthTasks.length === 1 ? "taak" : "taken"}</strong>
          </summary>
          <div class="archive-month-list">
            ${monthTasks
              .map(
                (task) => `
                  <article class="task-card archived">
                    <div>
                      <strong>${escapeHtml(task.type)}</strong>
                      <div class="task-meta">
                        <span class="pill">${periodTypeLabel(task.periodType)}</span>
                        <span>${escapeHtml(taskPeriodLabel(task))}</span>
                        ${formatRoute(task) ? `<span>${escapeHtml(formatRoute(task))}</span>` : ""}
                        ${task.type === "CoderDojo" ? `<span>Aantal kratten: ${task.amount || 15}</span>` : task.amount ? `<span>Aantal: ${task.amount}</span>` : ""}
                        ${task.time ? `<span>Tijd: ${task.time} min</span>` : ""}
                      </div>
                      ${task.description ? `<p class="task-note">${escapeHtml(task.description)}</p>` : ""}
                      ${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}
                    </div>
                    <div class="task-actions">
                      <button class="edit-button" type="button" data-edit="${task.id}">Wijzig</button>
                      <button class="delete-button" type="button" data-delete="${task.id}">Verwijder</button>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </details>
      `,
    )
    .join("");
}

function groupTasksByMonth(tasks) {
  return tasks.reduce((groups, task) => {
    const month = task.month || (task.date ? task.date.slice(0, 7) : weekToMonth(task.week));
    if (!groups[month]) groups[month] = [];
    groups[month].push(task);
    return groups;
  }, {});
}

function taskPeriodLabel(task) {
  if (task.periodType === "month") return formatMonthLabel(task.month);
  if (task.periodType === "year") return `Jaar ${task.year}`;
  if (task.periodType === "day") return formatDateLabel(task.date);
  return formatWeekLabel(task.week);
}

function periodTypeLabel(type) {
  if (type === "month") return "Maand";
  if (type === "year") return "Jaar";
  if (type === "day") return "Dag";
  return "Week";
}

function formatRoute(task) {
  if (task.type === "Extra sorteerwerk" || task.type === "Extra kratten ophalen") {
    return task.to ? `Bij: ${task.to}` : "";
  }
  if (task.type === "Eelan") return task.to ? `Naar: ${task.to}` : "";
  if (task.from && task.to) return `${task.from} -> ${task.to}`;
  if (task.to) return `Naar: ${task.to}`;
  if (task.from) return `Van: ${task.from}`;
  return "";
}

function renderReport(tasks) {
  const totalTime = tasks.reduce((sum, task) => sum + Number(task.time || 0), 0);
  const locations = new Set(tasks.flatMap((task) => [task.from, task.to].filter(Boolean)));

  stats.tasks.textContent = tasks.length;
  stats.locations.textContent = locations.size;
  stats.time.textContent = `${totalTime} min`;
  stats.typeReport.innerHTML = renderReportRows(groupBy(tasks, "type"));
  stats.locationReport.innerHTML = renderReportRows(groupLocations(tasks));
}

function groupBy(tasks, key) {
  return tasks.reduce((groups, task) => {
    const label = task[key] || "Onbekend";
    groups[label] = (groups[label] || 0) + 1;
    return groups;
  }, {});
}

function groupLocations(tasks) {
  return tasks.reduce((groups, task) => {
    [task.from, task.to].filter(Boolean).forEach((location) => {
      groups[location] = (groups[location] || 0) + 1;
    });
    return groups;
  }, {});
}

function renderReportRows(groups) {
  const rows = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return '<div class="empty-state">Nog geen gegevens.</div>';

  return rows
    .map(
      ([label, amount]) => `
        <div class="report-row">
          <span>${escapeHtml(label)}</span>
          <strong>${amount}</strong>
        </div>
      `,
    )
    .join("");
}

// Taken opslaan, wijzigen en verwijderen.
function buildTaskFromForm(existingTask = {}) {
  const periodType = selectedPeriodType();
  const chosenType = inputs.type.value;
  const isCustomTask = chosenType === CUSTOM_OPTION || chosenType === LEGACY_CUSTOM_OPTION;
  const type = isCustomTask ? inputs.customTask.value.trim() : chosenType;

  if (!type) {
    inputs.type.focus();
    return null;
  }

  let from = selectedLocation(inputs.from, inputs.customFrom);
  let to = selectedLocation(inputs.to, inputs.customTo);

  if (chosenType === "Plukker") from = "";
  if (chosenType === "Eelan") from = "Eelan";
  if (chosenType === "Garage") {
    from = "";
    to = "";
  }

  const date = periodType === "day" ? inputs.date.value : "";
  const week = periodType === "week" ? inputs.week.value : weekFromDate(date);
  const month = periodType === "day" ? date.slice(0, 7) : weekToMonth(week);
  const year = periodType === "day" ? date.slice(0, 4) : week.slice(0, 4);
  const isCoderDojo = chosenType === "CoderDojo";
  const isGarage = chosenType === "Garage";
  const isMeubel = chosenType === "Meubel verplaatsen";
  const isStort = chosenType === "Stort";
  const hasAmount = !(isCoderDojo || isGarage || isMeubel || isStort) && inputs.amount.value !== "";
  const hasDescription = !(["Plukker", "Eelan", "Extra sorteerwerk", "Extra kratten ophalen", "CoderDojo", CUSTOM_OPTION, LEGACY_CUSTOM_OPTION].includes(chosenType));
  const hasNote = !["Meubel verplaatsen", CUSTOM_OPTION, LEGACY_CUSTOM_OPTION].includes(chosenType);

  return {
    ...existingTask,
    id: existingTask.id || crypto.randomUUID(),
    sessionId: existingTask.sessionId || state.currentSessionId,
    periodType,
    week,
    date,
    month,
    year,
    type,
    from,
    to,
    amount: isCoderDojo ? 15 : hasAmount ? Number(inputs.amount.value) : "",
    time: TIME_TASKS.includes(chosenType) ? inputs.time.value.trim() : "",
    description: hasDescription ? inputs.description.value.trim() : "",
    note: hasNote ? inputs.note.value.trim() : "",
    createdAt: existingTask.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function saveTask(event) {
  event.preventDefault();
  const existingTask = editingTaskId ? state.tasks.find((task) => task.id === editingTaskId) : null;
  const wasEditing = Boolean(editingTaskId);
  const task = buildTaskFromForm(existingTask || {});
  if (!task) return;

  if (editingTaskId) {
    state.tasks = state.tasks.map((item) => (item.id === editingTaskId ? task : item));
  } else {
    state.tasks.push(task);
  }

  saveState();
  resetForm(task.periodType, task.week, task.date);
  showSaveMessage(wasEditing ? "Wijziging opgeslagen" : "Taak opgeslagen");
  render();
  inputs.type.focus();
}

function showSaveMessage(message) {
  saveMessage.textContent = message;
  saveMessage.classList.remove("is-hidden");
  window.clearTimeout(showSaveMessage.timer);
  showSaveMessage.timer = window.setTimeout(() => {
    saveMessage.classList.add("is-hidden");
  }, 1800);
}

function resetForm(periodType = selectedPeriodType(), week = inputs.week.value, date = inputs.date.value) {
  editingTaskId = null;
  taskForm.reset();
  document.querySelector(`input[name="periodType"][value="${periodType}"]`).checked = true;
  inputs.week.value = week || getCurrentWeekValue();
  inputs.date.value = date || todayValue();
  inputs.amount.value = "";
  inputs.time.value = "";
  submitButton.textContent = "Taak opslaan";
  cancelEditButton.classList.add("is-hidden");
  pageTitle.textContent = currentView === "rapportage" ? "Rapportage" : "Taak toevoegen";
  syncPeriodControls();
  syncTaskFields();
}

function editTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  editingTaskId = task.id;
  setView("registratie");
  document.querySelector(`input[name="periodType"][value="${task.periodType || "week"}"]`).checked = true;
  inputs.week.value = task.week || getCurrentWeekValue();
  inputs.date.value = task.date || todayValue();

  if (KNOWN_TASKS.includes(task.type)) {
    inputs.type.value = task.type;
    inputs.customTask.value = "";
  } else {
    inputs.type.value = CUSTOM_OPTION;
    inputs.customTask.value = task.type;
  }

  syncPeriodControls();
  syncTaskFields();
  setSelectValue(inputs.from, task.from, inputs.customFrom);
  setSelectValue(inputs.to, task.to, inputs.customTo);
  syncLocationCustomInputs();
  inputs.amount.value = task.amount || "";
  inputs.time.value = task.time || "";
  inputs.description.value = task.description || "";
  inputs.note.value = task.note || "";
  submitButton.textContent = "Wijziging opslaan";
  cancelEditButton.classList.remove("is-hidden");
  pageTitle.textContent = "Taak wijzigen";
}

function deleteTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const confirmed = window.confirm(
    `Wil je deze registratie definitief verwijderen?\n\n${task.type} wordt verwijderd en kan daarna niet worden teruggehaald.`,
  );
  if (!confirmed) return;

  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveState();
  if (editingTaskId === taskId) resetForm();
  render();
}

// Rapportage exporteren.
function exportCsv() {
  const tasks = getFilteredTasks({ includeArchive: true });
  if (tasks.length === 0) return;

  const headers = ["Periode", "Week", "Maand", "Jaar", "Taak", "Van", "Naar", "Aantal", "Tijd minuten", "Omschrijving", "Opmerking"];
  const rows = tasks.map((task) => [
    task.periodType === "month" ? "Maand" : task.periodType === "year" ? "Jaar" : "Week",
    task.week,
    task.month,
    task.year,
    task.type,
    task.from,
    task.to,
    task.amount,
    task.time,
    task.description,
    task.note,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `boekenbode-${filterLabel().toLowerCase().replaceAll(" ", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function logout() {
  state.currentSessionId = newSessionId();
  saveState();
  resetForm("week", getCurrentWeekValue(), todayValue());
  appView.classList.add("is-hidden");
  homeView.classList.remove("is-hidden");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Startwaarden en event listeners.
inputs.week.value = getCurrentWeekValue();
inputs.reportWeek.value = inputs.week.value;
inputs.date.value = todayValue();
inputs.reportMonth.value = currentMonthValue();
inputs.reportYear.value = currentYearValue();
inputs.amount.value = "";

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => openApp(button.dataset.go));
});

homeButton.addEventListener("click", () => {
  appView.classList.add("is-hidden");
  homeView.classList.remove("is-hidden");
});

helpButton.addEventListener("click", () => helpModal.classList.remove("is-hidden"));
closeHelpButton.addEventListener("click", () => helpModal.classList.add("is-hidden"));
helpModal.addEventListener("click", (event) => {
  if (event.target === helpModal) helpModal.classList.add("is-hidden");
});
logoutButton.addEventListener("click", logout);

periodRadios.forEach((radio) =>
  radio.addEventListener("change", () => {
    syncPeriodControls();
    render();
  }),
);
reportRadios.forEach((radio) =>
  radio.addEventListener("change", () => {
    syncReportControls();
    hideReportResults();
  }),
);

["change", "input"].forEach((eventName) => {
  inputs.week.addEventListener(eventName, render);
  inputs.date.addEventListener(eventName, render);
  inputs.reportWeek.addEventListener(eventName, hideReportResults);
  inputs.reportMonth.addEventListener(eventName, hideReportResults);
  inputs.reportYear.addEventListener(eventName, hideReportResults);
});

inputs.type.addEventListener("change", syncTaskFieldsWithoutJump);
inputs.from.addEventListener("change", syncLocationCustomInputs);
inputs.to.addEventListener("change", syncLocationCustomInputs);
todayButton.addEventListener("click", () => {
  inputs.date.value = todayValue();
  render();
});

taskForm.addEventListener("submit", saveTask);
cancelEditButton.addEventListener("click", () => resetForm());
exportButton.addEventListener("click", exportCsv);
showReportButton.addEventListener("click", showReportResults);
taskList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editTask(editButton.dataset.edit);
  if (deleteButton) deleteTask(deleteButton.dataset.delete);
});
archiveList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editTask(editButton.dataset.edit);
  if (deleteButton) deleteTask(deleteButton.dataset.delete);
});

syncPeriodControls();
syncReportControls();
syncTaskFields();
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
render();
loadCentralState();
