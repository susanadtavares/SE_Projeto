import { useEffect, useMemo, useRef, useState } from "react";
import SensorCard from "../components/SensorCard";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const MAX_POINTS = 60;

// Helpers de status
function statusTemp(t){ if(t==null) return ""; if(t<18) return "Frio"; if(t<=26) return "Confortável"; return "Quente"; }
function statusHum(h){ if(h==null) return ""; if(h<30) return "Seco"; if(h<=60) return "Ótimo"; return "Húmido"; }
function statusAQI(a){ if(a==null) return ""; if(a<=50) return "Bom"; if(a<=100) return "Moderado"; if(a<=150) return "Sensível"; if(a<=200) return "Mau"; return "Muito mau"; }

// Gera demo caso o backend não responda
function nextDemo(prev = { temp:22, hum:48, aqi:35 }) {
  const n = {
    temp: +(prev.temp + (Math.random()-.5)*0.3).toFixed(2),
    hum:  +(prev.hum  + (Math.random()-.5)*0.8).toFixed(2),
    aqi:  Math.max(5, Math.min(180, Math.round(prev.aqi + (Math.random()-.5)*4))),
  };
  return n;
}

export default function Dashboard() {
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const demoRef = useRef({ temp:22.3, hum:47.5, aqi:38 });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/api/last", { mode: "cors" });
        if (res.status === 204) throw new Error("sem dados");
        if (!res.ok) throw new Error("erro http");
        const data = await res.json(); // esperado: { temp, hum, aqi?, ts }
        const now = data.ts ? new Date(data.ts) : new Date();
        const r = {
          temp: Number(data.temp ?? data.temperature),
          hum:  Number(data.hum  ?? data.humidity),
          aqi:  Number(data.aqi  ?? data.airQuality ?? 40),
          ts:   now.getTime(),
        };
        setReading(r);
        setHistory(prev => {
          const next = [...prev, { t: now.toLocaleTimeString(), ...r }];
          if (next.length > MAX_POINTS) next.shift();
          return next;
        });
      } catch {
        // DEMO
        const n = nextDemo(demoRef.current);
        demoRef.current = n;
        const now = new Date();
        const r = { ...n, ts: now.getTime() };
        setReading(r);
        setHistory(prev => {
          const next = [...prev, { t: now.toLocaleTimeString(), ...r }];
          if (next.length > MAX_POINTS) next.shift();
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => ({
    labels: history.map(h => h.t),
    datasets: [
      { label: "Temperatura (°C)", data: history.map(h => h.temp), tension: .35, fill: false },
      { label: "Humidade (%)",     data: history.map(h => h.hum),  tension: .35, fill: false },
      { label: "AQI",              data: history.map(h => h.aqi),  tension: .35, fill: false, yAxisID: "y2" },
    ],
  }), [history]);

  const options = useMemo(() => ({
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { labels: { color: "#fff" } },
      tooltip: { enabled: true }
    },
    scales: {
      x: { ticks: { color: "#c9c9d1" }, grid: { color: "rgba(255,255,255,.06)" } },
      y: {
        ticks: { color: "#c9c9d1" },
        grid: { color: "rgba(255,255,255,.06)" },
        title: { display: true, text: "°C / %", color: "#c9c9d1" }
      },
      y2: {
        position: "right",
        ticks: { color: "#c9c9d1" },
        grid: { drawOnChartArea: false },
        title: { display: true, text: "AQI", color: "#c9c9d1" }
      }
    }
  }), []);

  return (
    <div className="grid" style={{ display: "grid", gap: 16 }}>
      <h1>Dashboard Ambiental</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <SensorCard
          title="Temperatura"
          value={reading?.temp?.toFixed(1)}
          unit="°C"
          status={statusTemp(reading?.temp)}
        />
        <SensorCard
          title="Humidade"
          value={reading?.hum?.toFixed(0)}
          unit="%"
          status={statusHum(reading?.hum)}
        />
        <SensorCard
          title="Qualidade do Ar (AQI)"
          value={reading?.aqi ?? "--"}
          unit=""
          status={statusAQI(reading?.aqi)}
        />
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="card-title">Histórico (tempo real)</div>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
