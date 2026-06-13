const demoSchools = [
  { name: "Escuela Tecnica N 4 Energia", initial: 18500, current: 14060, actions: 8, participation: 84 },
  { name: "Colegio Horizonte Verde", initial: 16200, current: 12900, actions: 7, participation: 91 },
  { name: "Instituto San Martin", initial: 21800, current: 18420, actions: 6, participation: 76 },
  { name: "Escuela Industrial Belgrano", initial: 24400, current: 19880, actions: 9, participation: 68 },
  { name: "Colegio Innovacion Sur", initial: 15100, current: 13200, actions: 5, participation: 88 },
  { name: "Escuela Media Rio de la Plata", initial: 17600, current: 15850, actions: 4, participation: 72 }
];

const chartData = [
  { month: "Mar", value: 18.4 },
  { month: "Abr", value: 17.1 },
  { month: "May", value: 15.8 },
  { month: "Jun", value: 14.6 },
  { month: "Jul", value: 13.9 },
  { month: "Ago", value: 12.8 }
];

const storageKey = "eduficiaRanking";
const themeKey = "eduficiaTheme";

let ranking = [];
let latestScore = null;

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const jumpButtons = document.querySelectorAll("[data-jump]");
const themeToggle = document.getElementById("themeToggle");
const rankingBody = document.getElementById("rankingBody");
const scoreForm = document.getElementById("scoreForm");
const scoreOutput = document.getElementById("scoreOutput");
const scoreMeter = document.getElementById("scoreMeter");
const formulaDetail = document.getElementById("formulaDetail");
const addToRankingButton = document.getElementById("addToRanking");
const closeSemesterButton = document.getElementById("closeSemester");
const resetScoresButton = document.getElementById("resetScores");
const restoreDemoButton = document.getElementById("restoreDemo");
const restoreDemoTopButton = document.getElementById("restoreDemoTop");
const winnerName = document.getElementById("winnerName");
const winnerDetail = document.getElementById("winnerDetail");
const avgScore = document.getElementById("avgScore");
const heroLeaderScore = document.getElementById("heroLeaderScore");
const heroSchoolCount = document.getElementById("heroSchoolCount");
const heroEfficiency = document.getElementById("heroEfficiency");
const decisionList = document.getElementById("decisionList");
const simSavings = document.getElementById("simSavings");
const simPoints = document.getElementById("simPoints");
const simCo2 = document.getElementById("simCo2");
const simMoney = document.getElementById("simMoney");
const simImpact = document.getElementById("simImpact");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateSchoolScore(school) {
  const improvement = ((school.initial - school.current) / school.initial) * 100;
  const score = improvement * 2 + school.actions * 4 + school.participation * 0.3;

  return {
    ...school,
    improvement: clamp(improvement, -100, 100),
    score: clamp(score, 0, 100)
  };
}

function loadRanking() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    ranking = demoSchools.map(calculateSchoolScore);
    saveRanking();
    return;
  }

  try {
    ranking = JSON.parse(saved).map(calculateSchoolScore);
  } catch {
    ranking = demoSchools.map(calculateSchoolScore);
    saveRanking();
  }
}

function saveRanking() {
  localStorage.setItem(storageKey, JSON.stringify(ranking));
}

function sortedRanking() {
  return [...ranking].sort((a, b) => b.score - a.score);
}

function renderRanking() {
  const rows = sortedRanking();
  rankingBody.innerHTML = rows.map((school, index) => `
    <tr>
      <td><strong>${index + 1}</strong></td>
      <td>${school.name}</td>
      <td>${school.improvement.toFixed(1)}%</td>
      <td>${school.actions}</td>
      <td>${school.participation}%</td>
      <td><strong>${school.score.toFixed(1)}</strong></td>
    </tr>
  `).join("");

  const average = rows.length ? rows.reduce((sum, school) => sum + school.score, 0) / rows.length : 0;
  const leader = rows[0];

  avgScore.textContent = average.toFixed(1);
  heroLeaderScore.textContent = leader ? Math.round(leader.score) : "0";
  heroSchoolCount.textContent = rows.length;
  heroEfficiency.textContent = `${Math.round(clamp(average, 0, 100))}%`;
}

function switchTab(tabId) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabId));
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
  history.replaceState(null, "", `#${tabId}`);
}

function renderChart() {
  const max = Math.max(...chartData.map((item) => item.value));
  const chart = document.getElementById("consumptionChart");

  chart.innerHTML = chartData.map((item) => {
    const height = Math.max((item.value / max) * 100, 12);
    return `<div class="bar" style="height: ${height}%"><span>${item.month}</span></div>`;
  }).join("");
}

function calculateFromForm() {
  const school = {
    name: document.getElementById("schoolName").value.trim() || "Escuela sin nombre",
    initial: Number(document.getElementById("initialConsumption").value),
    current: Number(document.getElementById("currentConsumption").value),
    actions: Number(document.getElementById("actionsCount").value),
    participation: Number(document.getElementById("participation").value)
  };

  if (!school.initial || school.initial <= 0) {
    latestScore = null;
    scoreOutput.textContent = "0";
    scoreMeter.style.width = "0%";
    formulaDetail.textContent = "El consumo inicial debe ser mayor a cero.";
    return null;
  }

  latestScore = calculateSchoolScore(school);
  scoreOutput.textContent = latestScore.score.toFixed(1);
  scoreMeter.style.width = `${latestScore.score}%`;
  formulaDetail.textContent = `Mejora: ${latestScore.improvement.toFixed(1)}%. Acciones: ${school.actions}. Participacion: ${school.participation}%.`;
  return latestScore;
}

function addLatestToRanking() {
  const school = calculateFromForm();
  if (!school) return;

  const existingIndex = ranking.findIndex((item) => item.name.toLowerCase() === school.name.toLowerCase());
  if (existingIndex >= 0) {
    ranking[existingIndex] = school;
  } else {
    ranking.push(school);
  }

  saveRanking();
  renderRanking();
  switchTab("ranking");
}

function closeSemester() {
  const winner = sortedRanking()[0];
  if (!winner) return;

  winnerName.textContent = winner.name;
  winnerDetail.textContent = `${winner.score.toFixed(1)} puntos, ${winner.improvement.toFixed(1)}% de mejora y ${winner.actions} acciones implementadas.`;
}

function resetScores() {
  ranking = ranking.map((school) => calculateSchoolScore({
    ...school,
    current: school.initial,
    actions: 0,
    participation: 0
  }));
  saveRanking();
  renderRanking();
  winnerName.textContent = "Puntajes reiniciados";
  winnerDetail.textContent = "Nuevo semestre listo para cargar mediciones y acciones.";
}

function restoreDemoData() {
  ranking = demoSchools.map(calculateSchoolScore);
  saveRanking();
  renderRanking();
  winnerName.textContent = "Aun no cerrado";
  winnerDetail.textContent = "Cierra el semestre para declarar ganador.";
}

function updateSimulator() {
  const checked = [...decisionList.querySelectorAll("input:checked")];
  const points = checked.reduce((sum, input) => sum + Number(input.value), 0);
  const kwh = checked.reduce((sum, input) => sum + Number(input.dataset.kwh), 0);
  const co2 = kwh * 0.38;
  const money = kwh * 95;

  simSavings.textContent = `${kwh.toLocaleString("es-AR")} kWh`;
  simPoints.textContent = points;
  simCo2.textContent = `${Math.round(co2).toLocaleString("es-AR")} kg`;
  simMoney.textContent = `$${Math.round(money).toLocaleString("es-AR")}`;
  simImpact.textContent = checked.length
    ? `${checked.length} decisiones seleccionadas. Priorizacion sugerida: implementar primero las de mayor ahorro por complejidad baja.`
    : "Selecciona acciones para estimar impacto mensual y puntos operativos.";
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeToggle.querySelector(".theme-icon").textContent = isDark ? "NOCHE" : "DIA";
  themeToggle.querySelector(".theme-label").textContent = isDark ? "Oscuro" : "Claro";
  localStorage.setItem(themeKey, theme);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

jumpButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.jump));
});

scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateFromForm();
});

addToRankingButton.addEventListener("click", addLatestToRanking);
closeSemesterButton.addEventListener("click", closeSemester);
resetScoresButton.addEventListener("click", resetScores);
restoreDemoButton.addEventListener("click", restoreDemoData);
restoreDemoTopButton.addEventListener("click", restoreDemoData);
decisionList.addEventListener("change", updateSimulator);

themeToggle.addEventListener("click", () => {
  applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
});

loadRanking();
renderRanking();
renderChart();
calculateFromForm();
updateSimulator();
applyTheme(localStorage.getItem(themeKey) || "light");

const initialTab = location.hash.replace("#", "");
if (initialTab && document.getElementById(initialTab)) {
  switchTab(initialTab);
}
