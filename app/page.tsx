"use client"
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { 
  Thermometer,
  Wind,
  Volume2,
  Sun,
  Gauge,
  Clock,
  CloudFog,
  AlertCircle,
  Bell,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SensorReading {
  sensor_id: string;
  timestamp: string;
  temperature: number;
  co2_level: number;
  humidity: number;
  noise_level: number;
  light_intensity: number;
  air_quality_index: number;
}

interface Warning {
  id: string;
  sensorId: string;
  message: string;
  timestamp: string;
  type: 'temperature' | 'co2';
  value: number;
}

const TEMP_THRESHOLD = 35;
const CO2_THRESHOLD = 1000;
const WARNING_RETENTION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_WARNINGS = 50;

const getStatusColor = (value: number, type: string): string => {
  switch(type) {
    case 'temperature':
      return value > TEMP_THRESHOLD ? 'text-red-500' : value > 25 ? 'text-amber-500' : value < 18 ? 'text-blue-500' : 'text-emerald-500';
    case 'co2':
      return value > CO2_THRESHOLD ? 'text-red-500' : value > 800 ? 'text-amber-500' : 'text-emerald-500';
    case 'humidity':
      return value > 70 ? 'text-red-500' : value < 30 ? 'text-amber-500' : 'text-emerald-500';
    case 'noise':
      return value > 70 ? 'text-red-500' : value > 50 ? 'text-amber-500' : 'text-emerald-500';
    case 'aqi':
      return value >= 7 ? 'text-emerald-500' : value >= 4 ? 'text-amber-500' : 'text-red-500';
    default:
      return 'text-slate-700';
  }
};

const NotificationBell = ({ warnings }: { warnings: Warning[] }) => {
  const activeWarnings = warnings.length;
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="fixed top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
          <div className="relative">
            <Bell className="h-6 w-6 text-slate-600" />
            {activeWarnings > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 min-w-[20px] h-5 flex items-center justify-center text-xs">
                {activeWarnings}
              </Badge>
            )}
          </div>
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Active Warnings</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          {warnings.length > 0 ? (
            <div className="space-y-2 mt-4">
              {warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`p-4 rounded-lg border ${
                    warning.type === 'temperature' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${
                        warning.type === 'temperature' ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        Sensor {warning.sensorId}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">{warning.message}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(warning.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p>No active warnings</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const MetricCard = ({ icon: Icon, label, value, unit, color }: any) => (
  <div className="relative overflow-hidden p-3 bg-white rounded-lg shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md hover:scale-102 group">
    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-blue-500 transition-colors duration-300" />
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('500', '100')} transition-colors duration-300`}>
        <Icon className={`${color} transition-colors duration-300`} size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`text-lg font-bold ${color} transition-colors duration-300`}>
          {value} <span className="text-sm font-normal text-slate-400">{unit}</span>
        </p>
      </div>
    </div>
  </div>
);

const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        padding: 10,
        font: {
          size: 11,
          weight: 'normal' as const
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      padding: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1e293b',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        padding: 5,
        font: {
          size: 10
        }
      }
    },
    y: {
      beginAtZero: false,
      grid: {
        color: '#f1f5f9',
        drawTicks: true
      },
      ticks: {
        padding: 5,
        font: {
          size: 10
        }
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
} as const;

export default function Home() {
  const [sensorData, setSensorData] = useState<Record<string, SensorReading[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);

  const AZURE_FUNCTION_URL = "https://sc21r2hcw2.azurewebsites.net/api/sensors";

  const cleanupOldWarnings = (currentWarnings: Warning[]) => {
    const now = Date.now();
    return currentWarnings
      .filter(warning => (now - new Date(warning.timestamp).getTime()) < WARNING_RETENTION_TIME)
      .slice(-MAX_WARNINGS);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(AZURE_FUNCTION_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: SensorReading[] = await response.json();
        
        // Process sensor data
        setSensorData(prev => {
          const updated = { ...prev };
          data.forEach(reading => {
            if (!updated[reading.sensor_id]) updated[reading.sensor_id] = [];
            const lastReading = updated[reading.sensor_id].slice(-1)[0];
            if (!lastReading || lastReading.timestamp !== reading.timestamp) {
              updated[reading.sensor_id] = [
                ...updated[reading.sensor_id],
                { ...reading, timestamp: new Date(reading.timestamp).toISOString() }
              ].slice(-100);
            }
          });
          return updated;
        });

        // Check for new warnings
        setWarnings(prevWarnings => {
          const newWarnings: Warning[] = [];
          const timestamp = new Date().toISOString();
          
          data.forEach(reading => {
            if (reading.temperature > TEMP_THRESHOLD) {
              newWarnings.push({
                id: `temp-${reading.sensor_id}-${timestamp}`,
                sensorId: reading.sensor_id,
                message: `High temperature alert: ${reading.temperature.toFixed(1)}°C`,
                timestamp,
                type: 'temperature',
                value: reading.temperature
              });
            }
            if (reading.co2_level > CO2_THRESHOLD) {
              newWarnings.push({
                id: `co2-${reading.sensor_id}-${timestamp}`,
                sensorId: reading.sensor_id,
                message: `High CO2 alert: ${reading.co2_level.toFixed(0)} ppm`,
                timestamp,
                type: 'co2',
                value: reading.co2_level
              });
            }
          });
          
          return cleanupOldWarnings([...prevWarnings, ...newWarnings]);
        });
        
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup old warnings periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      setWarnings(prevWarnings => cleanupOldWarnings(prevWarnings));
    }, 60000); // Check every minute
    
    return () => clearInterval(cleanup);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Data</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  const sortedSensorIds = Object.keys(sensorData).sort((a, b) => 
    parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''))
  );

  return (
    <main className="min-h-screen p-2 lg:p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <NotificationBell warnings={warnings} />
      
      <div className="max-w-[1920px] mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Environmental Monitoring Dashboard
          </h1>
          <p className="text-slate-600">Real-time sensor data monitoring and analysis</p>
        </header>

        <div className="space-y-6">
          {sortedSensorIds.map((sensorId) => {
            const readings = sensorData[sensorId];
            const latestReading = readings[readings.length - 1];
            const timeLabels = readings.map(r => 
              new Date(r.timestamp).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })
            );

            const charts = {
              temperature: {
                labels: timeLabels,
                datasets: [
                  {
                    label: "Temperature (°C)",
                    data: readings.map(r => r.temperature),
                    borderColor: "rgb(239, 68, 68)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                  },
                  {
                    label: "Temperature Threshold",
                    data: Array(timeLabels.length).fill(TEMP_THRESHOLD),
                    borderColor: "rgba(239, 68, 68, 0.5)",
                    borderDash: [5, 5],
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false
                  }
                ]
              },
              co2: {
                labels: timeLabels,
                datasets: [
                  {
                    label: "CO2 Level (ppm)",
                    data: readings.map(r => r.co2_level),
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                  },
                  {
                    label: "CO2 Threshold",
                    data: Array(timeLabels.length).fill(CO2_THRESHOLD),
                    borderColor: "rgba(239, 68, 68, 0.5)",
                    borderDash: [5, 5],
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false
                  }
                ]
              }
            };

            return (
              <div key={sensorId} className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Sensor {sensorId}</h2>
                    <div className="flex items-center gap-2 text-white/80 bg-white/10 px-4 py-2 rounded-lg">
                      <Clock size={16} />
                      <span className="text-sm">
                        Last updated: {new Date(latestReading.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MetricCard 
                      icon={Thermometer}
                      label="Temperature"
                      value={latestReading.temperature.toFixed(1)}
                      unit="°C"
                      color={getStatusColor(latestReading.temperature, 'temperature')}
                    />
                    <MetricCard 
                      icon={CloudFog}
                      label="CO2"
                      value={latestReading.co2_level.toFixed(0)}
                      unit="ppm"
                      color={getStatusColor(latestReading.co2_level, 'co2')}
                    />
                    <MetricCard 
                      icon={Wind}
                      label="Humidity"
                      value={latestReading.humidity.toFixed(1)}
                      unit="%"
                      color={getStatusColor(latestReading.humidity, 'humidity')}
                    />
                    <MetricCard 
                      icon={Volume2}
                      label="Noise"
                      value={latestReading.noise_level.toFixed(1)}
                      unit="dB"
                      color={getStatusColor(latestReading.noise_level, 'noise')}
                    />
                    <MetricCard 
                      icon={Sun}
                      label="Light"
                      value={latestReading.light_intensity.toFixed(1)}
                      unit="lx"
                      color="text-amber-500"
                    />
                    <MetricCard 
                      icon={Gauge}
                      label="AQI"
                      value={latestReading.air_quality_index}
                      unit="/10"
                      color={getStatusColor(latestReading.air_quality_index, 'aqi')}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <h3 className="text-base font-semibold text-slate-800 mb-2">Temperature Trend</h3>
                      <div className="h-[300px]">
                        <Line data={charts.temperature} options={chartOptions} />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <h3 className="text-base font-semibold text-slate-800 mb-2">CO2 Level Trend</h3>
                      <div className="h-[300px]">
                        <Line data={charts.co2} options={chartOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}