import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IMUVisualization = () => {
  const [data, setData] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [maxDataPoints, setMaxDataPoints] = useState(50);
  const timeRef = useRef(0);
  const intervalRef = useRef(null);

  // 模擬 IMU 數據生成
  const generateIMUData = () => {
    const time = timeRef.current;

    return {
      time: time.toFixed(2),
      // 加速度計數據 (g)
      accX: Math.sin(time * 0.5) * 2 + (Math.random() - 0.5) * 0.3,
      accY: Math.cos(time * 0.3) * 1.5 + (Math.random() - 0.5) * 0.3,
      accZ: 9.8 + Math.sin(time * 0.2) * 0.5 + (Math.random() - 0.5) * 0.2,
      // 陀螺儀數據 (deg/s)
      gyroX: Math.sin(time * 0.7) * 50 + (Math.random() - 0.5) * 10,
      gyroY: Math.cos(time * 0.4) * 40 + (Math.random() - 0.5) * 10,
      gyroZ: Math.sin(time * 0.6) * 30 + (Math.random() - 0.5) * 10,
    };
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setData(prevData => {
          const newData = [...prevData, generateIMUData()];
          if (newData.length > maxDataPoints) {
            return newData.slice(-maxDataPoints);
          }
          return newData;
        });
        timeRef.current += 0.1;
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxDataPoints]);

  const handleReset = () => {
    setData([]);
    timeRef.current = 0;
  };

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* 標題 */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-5xl">📊</span>
              IMU 六軸傳感器實時監控
            </h1>
            <p className="text-blue-200 text-lg">加速度計 + 陀螺儀數據可視化</p>
          </div>

          {/* 控制面板 */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={handleToggle}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-lg ${isRunning
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
                }`}
            >
              {isRunning ? '⏸ 暫停' : '▶ 開始'}
            </button>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg"
            >
              🔄 重置
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <label className="text-white font-medium">數據點數:</label>
              <select
                value={maxDataPoints}
                onChange={(e) => setMaxDataPoints(Number(e.target.value))}
                className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          {/* 當前數值顯示 */}
          {data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Acc X', value: data[data.length - 1].accX, unit: 'g', color: 'text-red-400' },
                { label: 'Acc Y', value: data[data.length - 1].accY, unit: 'g', color: 'text-green-400' },
                { label: 'Acc Z', value: data[data.length - 1].accZ, unit: 'g', color: 'text-blue-400' },
                { label: 'Gyro X', value: data[data.length - 1].gyroX, unit: '°/s', color: 'text-orange-400' },
                { label: 'Gyro Y', value: data[data.length - 1].gyroY, unit: '°/s', color: 'text-purple-400' },
                { label: 'Gyro Z', value: data[data.length - 1].gyroZ, unit: '°/s', color: 'text-pink-400' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-white/70 text-sm mb-1">{item.label}</div>
                  <div className={`text-2xl font-bold ${item.color}`}>
                    {item.value.toFixed(2)} <span className="text-sm">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 加速度計圖表 */}
          <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📈</span> 加速度計 (Accelerometer)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="time"
                  stroke="#ffffff80"
                  label={{ value: '時間 (s)', position: 'insideBottom', offset: -5, fill: '#fff' }}
                />
                <YAxis
                  stroke="#ffffff80"
                  label={{ value: '加速度 (g)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid #ffffff30',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="accX" stroke="#ef4444" name="X 軸" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="accY" stroke="#22c55e" name="Y 軸" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="accZ" stroke="#3b82f6" name="Z 軸" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 陀螺儀圖表 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🔄</span> 陀螺儀 (Gyroscope)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="time"
                  stroke="#ffffff80"
                  label={{ value: '時間 (s)', position: 'insideBottom', offset: -5, fill: '#fff' }}
                />
                <YAxis
                  stroke="#ffffff80"
                  label={{ value: '角速度 (°/s)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid #ffffff30',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="gyroX" stroke="#f97316" name="X 軸" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gyroY" stroke="#a855f7" name="Y 軸" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gyroZ" stroke="#ec4899" name="Z 軸" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 說明 */}
          <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-blue-100 text-sm">
              <strong>說明：</strong>此工具模擬顯示 IMU 六軸傳感器數據。加速度計測量線性加速度（單位：g），
              陀螺儀測量角速度（單位：度/秒）。每個傳感器都有 X、Y、Z 三個軸向的數據。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMUVisualization;
