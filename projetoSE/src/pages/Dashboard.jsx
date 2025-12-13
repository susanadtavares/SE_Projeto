import { useEffect, useMemo, useRef, useState } from "react";
import SensorCard from "../components/SensorCard";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  Decimation,
  Title,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler, Decimation, Title);

const MAX_POINTS = 60;
const BASE_URL = import.meta?.env?.VITE_API_URL ?? "http://localhost:3001";
const ENDPOINT = `${BASE_URL}/api/readings/last`;
const POLL_MS = 1000; // intervalo base

// Helpers de status
const statusTemp = (t) => (t == null ? "" : t < 18 ? "Frio" : t <= 26 ? "Confortável" : "Quente");
const statusHum  = (h) => (h == null ? "" : h < 30 ? "Seco" : h <= 60 ? "Ótimo" : "Húmido");
const statusAQI  = (a) => {
  if (a == null) return "";
  if (a <= 600) return "Bom";
  if (a <= 1000) return "Moderado";
  if (a <= 1500) return "Mau";
  return "Muito mau";
};

// Gera demo caso o backend não responda
function nextDemo(prev = { temp: 22, hum: 48, aqi: 35 }) {
  const n = {
    temp: +(prev.temp + (Math.random() - 0.5) * 0.3).toFixed(2),
    hum: +(prev.hum + (Math.random() - 0.5) * 0.8).toFixed(2),
    aqi: Math.max(5, Math.min(180, Math.round(prev.aqi + (Math.random() - 0.5) * 4))),
  };
  return n;
}

export default function Dashboard() {
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const demoRef = useRef({ temp: 22.3, hum: 47.5, aqi: 38 });

  const visibleRef = useRef(true);
  const abortRef = useRef(null);
  const backoffRef = useRef(1);
  const timerRef = useRef(null);
  const lastAlertAttempt = useRef(0);

  // Atualizar relógio para verificar offline
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Alerta de AQI (Trigger Frontend)
  useEffect(() => {
    if (!reading) return;
    
    // Debug logs
    // console.log("Reading AQI:", reading.aqi);

    // Se AQI > 1000 (Mau)
    if (reading.aqi > 1000) {
      const now = Date.now();
      
      console.log("AQI Alto detetado!", reading.aqi);
      
      // Tenta enviar apenas se passou 1 minuto desde a última tentativa local
      if (now - lastAlertAttempt.current > 60000) {
        console.log("Tentando enviar alerta...");
        lastAlertAttempt.current = now;
        
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            console.warn("User não encontrado no localStorage");
            return;
        }
        
        try {
          const user = JSON.parse(userStr);
          if (!user || !user.email) {
             console.warn("Email não encontrado no user do localStorage");
             return;
          }

          console.log("Enviando fetch para notify...", user.email);

          fetch(`${BASE_URL}/api/alerts/notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ aqi: reading.aqi, email: user.email })
          })
          .then(res => res.json())
          .then(data => console.log("Resposta do alerta:", data))
          .catch(err => console.error("Erro ao enviar alerta:", err));
        } catch (e) {
          console.error("Erro ao ler user do localStorage", e);
        }
      } else {
          console.log("Alerta ignorado (cooldown local)");
      }
    }
  }, [reading]);

  // Observa visibilidade do tab para pausar/resumir pooling
  useEffect(() => {
    const onVisibility = () => {
      visibleRef.value = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Pooling com backoff e AbortController
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;

      // pausa quando o tab não está visível para poupar CPU
      if (document.visibilityState !== "visible") {
        timerRef.current = setTimeout(tick, POLL_MS);
        return;
      }

      try {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        // Obter token do localStorage (já vem como string JSON)
        const token = localStorage.getItem("token");

        const res = await fetch(ENDPOINT, { 
          mode: "cors", 
          signal: ctrl.signal,
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.status === 204) throw new Error("sem dados");
        if (!res.ok) throw new Error(`erro http ${res.status}`);

        const data = await res.json(); // esperado: { temp, hum, aqi?, ts }
        const now = data.ts ? new Date(data.ts) : new Date();
        const r = {
          temp: Number(data.temp ?? data.temperature ?? NaN),
          hum: Number(data.hum ?? data.humidity ?? NaN),
          aqi: Number(data.aqi ?? data.airQuality ?? NaN),
          fire: data.fire,
          fireDanger: data.fireDanger,
          ts: now.getTime(),
        };

        setUsingDemo(false);
        setReading(r);
        setHistory((prev) => {
          const next = [...prev, { t: now, ...r }];
          if (next.length > MAX_POINTS) next.shift();
          return next;
        });

        backoffRef.current = 1; // sucesso: reset backoff
      } catch (err) {
        console.warn("Falha ao obter dados:", err);
        // Se falhar, não usamos demo. Mantemos o estado anterior ou assumimos erro.
        // O isOffline vai tratar de mostrar "N/A" se o timestamp for antigo.
        setUsingDemo(false); 
        
        // aumenta backoff até 10x
        backoffRef.current = Math.min(backoffRef.current * 1.6, 10);
      } finally {
        const delay = POLL_MS * backoffRef.current;
        timerRef.current = setTimeout(tick, delay);
      }
    };

    tick();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
      clearTimeout(timerRef.current);
    };
  }, []);

  // Formatter de tempo (evita recalcular a cada render)
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    []
  );

  // Chart data (com gradiente leve para Temp/Hum)
  const chartData = useMemo(() => {
    const labels = history.map((h) => timeFmt.format(h.t));
    const temps = history.map((h) => h.temp);
    const hums = history.map((h) => h.hum);
    const aqis = history.map((h) => h.aqi);

    return {
      labels,
      datasets: [
        {
          label: "Temperatura (°C)",
          data: temps,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
          borderColor: "#ff3d00",
          backgroundColor: "rgba(255, 61, 0, 0.1)",
        },
        {
          label: "Humidade (%)",
          data: hums,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
          borderColor: "#ff9100",
          backgroundColor: "rgba(255, 145, 0, 0.1)",
        },
        {
          label: "AQI",
          data: aqis,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          yAxisID: "y2",
          fill: false,
          borderColor: "#ff3d00",
        },
      ],
    };
  }, [history, timeFmt]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 }, // live: sem animações caras
      interaction: { mode: "index", intersect: false },
      plugins: {
        title: {
          display: true,
          text: `Histórico (tempo real)${usingDemo ? " — modo demo" : ""}`,
          color: "#fff",
          padding: { bottom: 8 },
        },
        legend: {
          labels: { color: "#9a9a9a", usePointStyle: true, boxWidth: 8 },
        },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: { color: "#9a9a9a", maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
          grid: { color: "rgba(255,255,255,.06)" },
        },
        y: {
          type: 'linear',
          min: 0,
          max: 100,
          ticks: { color: "#9a9a9a" },
          grid: { color: "rgba(255,255,255,.06)" },
          title: { display: true, text: "°C / %", color: "#9a9a9a" },
        },
        y2: {
          type: 'linear',
          min: 400,
          max: 1500,
          position: "right",
          ticks: { color: "#9a9a9a" },
          grid: { drawOnChartArea: false },
          title: { display: true, text: "AQI", color: "#9a9a9a" },
        },
      },
    }),
    [usingDemo]
  );

  const isOffline = useMemo(() => {
    if (usingDemo) return false;
    if (!reading?.ts) return true;
    // Se os dados têm mais de 5 segundos, consideramos offline
    return currentTime - reading.ts > 5000;
  }, [reading, usingDemo, currentTime]);

  return (
    <div className="content">
      <div className="row">
        <div className="col-12">
          <div className="card card-chart">
            <div className="card-header">
              <div className="row">
                <div className="col-sm-6 text-left">
                  <h5 className="card-category">Visão Geral</h5>
                  <h2 className="card-title">Dashboard Ambiental</h2>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-area" style={{ height: "450px" }}>
                <Line data={chartData} options={options} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3">
          <SensorCard
            title="Temperatura"
            value={isOffline ? "N/A" : (Number.isFinite(reading?.temp) ? reading.temp.toFixed(1) : "--")}
            unit={isOffline ? "" : "°C"}
            status={isOffline ? "Desligado" : statusTemp(reading?.temp)}
            icon="tim-icons icon-thermometer-25"
            color={isOffline ? "text-secondary" : "text-warning"}
          />
        </div>
        <div className="col-lg-3">
          <SensorCard
            title="Humidade"
            value={isOffline ? "N/A" : (Number.isFinite(reading?.hum) ? reading.hum.toFixed(0) : "--")}
            unit={isOffline ? "" : "%"}
            status={isOffline ? "Desligado" : statusHum(reading?.hum)}
            icon="tim-icons icon-shape-star"
            color={isOffline ? "text-secondary" : "text-info"}
          />
        </div>
        <div className="col-lg-3">
          <SensorCard
            title="Qualidade do Ar"
            value={isOffline ? "N/A" : (Number.isFinite(reading?.aqi) ? reading.aqi : "--")}
            unit={isOffline ? "" : "AQI"}
            status={isOffline ? "Desligado" : statusAQI(reading?.aqi)}
            icon="tim-icons icon-molecule-40"
            color={isOffline ? "text-secondary" : "text-success"}
          />
        </div>
        <div className="col-lg-3">
          <SensorCard
            title="Risco de Incêndio"
            value={isOffline ? "N/A" : (reading?.fireDanger ? "PERIGO" : "Seguro")}
            unit=""
            status={isOffline ? "Desligado" : (reading?.fire === 1 ? "Fogo detetado (Câmara)" : "Sem deteção (Câmara)")}
            icon="tim-icons icon-alert-circle-exc"
            color={isOffline ? "text-secondary" : (reading?.fireDanger ? "text-danger" : "text-success")}
          />
        </div>
      </div>
    </div>
  );
}
