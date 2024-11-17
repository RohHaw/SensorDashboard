"use client";
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
  CloudFog
} from "lucide-react";

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

const getStatusColor = (value: number, type: string): string => {
  switch(type) {
    case 'temperature':
      return value > 25 ? 'text-red-500' : value < 18 ? 'text-blue-500' : 'text-green-500';
    case 'co2':
      return value > 1000 ? 'text-red-500' : value > 800 ? 'text-yellow-500' : 'text-green-500';
    case 'humidity':
      return value > 70 ? 'text-red-500' : value < 30 ? 'text-yellow-500' : 'text-green-500';
    case 'noise':
      return value > 70 ? 'text-red-500' : value > 50 ? 'text-yellow-500' : 'text-green-500';
    case 'aqi':
      return value >= 7 ? 'text-green-500' : value >= 4 ? 'text-yellow-500' : 'text-red-500';
    default:
      return 'text-gray-700';
  }
};

export default function Home() {
  const [sensorData, setSensorData] = useState<Record<string, SensorReading[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const AZURE_FUNCTION_URL = "https://sc21r2hcw2.azurewebsites.net/api/sensors";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(AZURE_FUNCTION_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SensorReading[] = await response.json();

        setSensorData((prevData) => {
          const updatedData = { ...prevData };
          data.forEach((reading) => {
            if (!updatedData[reading.sensor_id]) {
              updatedData[reading.sensor_id] = [];
            }
            updatedData[reading.sensor_id] = [
              ...updatedData[reading.sensor_id],
              {
                ...reading,
                timestamp: new Date(reading.timestamp).toISOString(),
              },
            ].slice(-100);
          });
          return updatedData;
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          padding: 10
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading sensor data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  const sortedSensorIds = Object.keys(sensorData).sort((a, b) => 
    parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''))
  );

  return (
    <main className="min-h-screen p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Environmental Monitoring Dashboard
      </h1>
      <div className="space-y-8">
        {sortedSensorIds.map((sensorId) => {
          const readings = sensorData[sensorId];
          const timeLabels = readings.map((r) =>
            new Date(r.timestamp).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })
          );

          const temperatureData = {
            labels: timeLabels,
            datasets: [
              {
                label: "Temperature (°C)",
                data: readings.map((r) => r.temperature),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                tension: 0.4,
              },
            ],
          };

          const co2Data = {
            labels: timeLabels,
            datasets: [
              {
                label: "CO2 Level (ppm)",
                data: readings.map((r) => r.co2_level),
                borderColor: "rgb(54, 162, 235)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                tension: 0.4,
              },
            ],
          };

          const latestReading = readings[readings.length - 1];

          return (
            <div key={sensorId} className="bg-white border rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <h2 className="text-2xl font-bold text-white text-center">
                  Sensor {sensorId}
                </h2>
              </div>
              
              <div className="p-6">
                {/* Metrics Row */}
                <div className="grid grid-cols-7 gap-4 mb-6 bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className={getStatusColor(latestReading.temperature, 'temperature')} size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">Temperature</span>
                    <p className={`text-xl font-bold ${getStatusColor(latestReading.temperature, 'temperature')}`}>
                      {latestReading.temperature.toFixed(1)}°C
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudFog className={getStatusColor(latestReading.co2_level, 'co2')} size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">CO2</span>
                    <p className={`text-xl font-bold ${getStatusColor(latestReading.co2_level, 'co2')}`}>
                      {latestReading.co2_level.toFixed(0)} ppm
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className={getStatusColor(latestReading.humidity, 'humidity')} size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">Humidity</span>
                    <p className={`text-xl font-bold ${getStatusColor(latestReading.humidity, 'humidity')}`}>
                      {latestReading.humidity.toFixed(1)}%
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className={getStatusColor(latestReading.noise_level, 'noise')} size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">Noise</span>
                    <p className={`text-xl font-bold ${getStatusColor(latestReading.noise_level, 'noise')}`}>
                      {latestReading.noise_level.toFixed(1)} dB
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="text-yellow-500" size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">Light</span>
                    <p className="text-xl font-bold text-gray-700">
                      {latestReading.light_intensity.toFixed(1)} lx
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className={getStatusColor(latestReading.air_quality_index, 'aqi')} size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">AQI</span>
                    <p className={`text-xl font-bold ${getStatusColor(latestReading.air_quality_index, 'aqi')}`}>
                      {latestReading.air_quality_index}/10
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-gray-500" size={24} />
                    </div>
                    <span className="font-medium text-gray-600 text-sm mb-1">Updated</span>
                    <p className="text-sm font-medium text-gray-600">
                      {new Date(latestReading.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Graphs Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-[400px]">
                    <Line data={temperatureData} options={chartOptions} />
                  </div>
                  <div className="h-[400px]">
                    <Line data={co2Data} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}