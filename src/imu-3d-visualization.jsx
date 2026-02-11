import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const IMU3DVisualization = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  const [motionState, setMotionState] = useState('靜止');
  const [currentData, setCurrentData] = useState({
    accX: 0, accY: 0, accZ: 0,
    gyroX: 0, gyroY: 0, gyroZ: 0
  });

  const timeRef = useRef(0);
  const intervalRef = useRef(null);
  const trajectoryRef = useRef([]);
  const positionRef = useRef(new THREE.Vector3(0, 0, 0));
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));

  // 3D对象引用
  const objectsRef = useRef({
    accArrow: null,
    gyroArrow: null,
    cube: null,
    fastCube: null, // 新增：快速旋轉的IMU
    trajectoryLine: null,
    axesHelper: null
  });

  // 判断运动状态
  const determineMotionState = (data) => {
    const accMagnitude = Math.sqrt(data.accX ** 2 + data.accY ** 2 + data.accZ ** 2);
    const gyroMagnitude = Math.sqrt(data.gyroX ** 2 + data.gyroY ** 2 + data.gyroZ ** 2);

    // 去除重力影响（假设Z轴向上）
    const dynamicAcc = Math.sqrt(data.accX ** 2 + data.accY ** 2 + (data.accZ - 9.8) ** 2);

    if (dynamicAcc < 0.5 && gyroMagnitude < 20) {
      return { state: '靜止', color: '#10b981' };
    } else if (dynamicAcc < 2 && gyroMagnitude < 50) {
      return { state: '緩慢移動', color: '#3b82f6' };
    } else if (dynamicAcc < 5 && gyroMagnitude < 100) {
      return { state: '正常移動', color: '#f59e0b' };
    } else if (gyroMagnitude > 100) {
      return { state: '快速旋轉', color: '#ec4899' };
    } else {
      return { state: '劇烈運動', color: '#ef4444' };
    }
  };

  // 生成IMU数据
  const generateIMUData = () => {
    const time = timeRef.current;

    // 參數設置：繞圓運動
    // 假設我們想要一個圓形軌跡，需要向心加速度
    // 軌跡方程: x = R * cos(ωt), z = R * sin(ωt)
    // 速度方程: vx = -Rω * sin(ωt), vz = Rω * cos(ωt)
    // 加速度方程: ax = -Rω² * cos(ωt), az = -Rω² * sin(ωt)

    const R = 15; // 半徑
    const omega = 0.5; // 角速度 (rad/s)
    const noiseLevel = 0.2; // 噪聲等級

    // 基礎向心加速度
    const baseAccX = -R * (omega ** 2) * Math.cos(omega * time);
    const baseAccZ = -R * (omega ** 2) * Math.sin(omega * time); // 對應可視化中的 accY (映射到Z軸)

    // 添加"行走"的垂直震動 (Z軸，映射到 accZ)
    const walkBobbing = Math.sin(time * 10) * 2;

    // 生成數據
    const accX = baseAccX + (Math.random() - 0.5) * noiseLevel;
    const accY = baseAccZ + (Math.random() - 0.5) * noiseLevel; // 注意：這裡的accY被用作Z軸位移
    const accZ = 9.8 + walkBobbing + (Math.random() - 0.5) * 0.5;

    // 陀螺儀數據 (模擬轉向)
    // 恆定轉向 + 步伐造成的抖動
    const gyroX = Math.sin(time * 5) * 5;
    const gyroY = Math.cos(time * 5) * 5;
    const gyroZ = (omega * 180 / Math.PI) + (Math.random() - 0.5) * 2; // 轉換為 deg/s

    return { accX, accY, accZ, gyroX, gyroY, gyroZ };
  };

  // 初始化Three.js场景
  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Slate-100 for Light Nordic
    // scene.fog = new THREE.Fog(0xf1f5f9, 10, 50); // Optional fog
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 40, 40); // 調整相機位置以俯瞰圓形軌跡
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    rendererRef.current = renderer;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(8);
    scene.add(axesHelper);
    objectsRef.current.axesHelper = axesHelper;

    // -- 主 IMU 立方體 --
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6, // Blue-500
      transparent: true,
      opacity: 0.8,
      shininess: 60
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);
    objectsRef.current.cube = cube;

    // 添加主立方體边缘
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    cube.add(wireframe);

    // -- 第二個 IMU (快速旋轉) --
    // 放在原點上方懸浮，或者圓心位置
    const fastCubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const fastCubeMaterial = new THREE.MeshPhongMaterial({
      color: 0xf43f5e, // Rose-500
      transparent: true,
      opacity: 0.8,
      shininess: 60
    });
    const fastCube = new THREE.Mesh(fastCubeGeometry, fastCubeMaterial);
    fastCube.position.set(0, 5, 0);
    scene.add(fastCube);
    objectsRef.current.fastCube = fastCube;

    const fastEdges = new THREE.EdgesGeometry(fastCubeGeometry);
    const fastWireframe = new THREE.LineSegments(fastEdges, lineMaterial.clone());
    fastCube.add(fastWireframe);

    // 创建加速度箭头（红色）
    const accArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      5,
      0xe11d48, // Rose-600
      1,
      0.5
    );
    scene.add(accArrow);
    objectsRef.current.accArrow = accArrow;

    // 创建陀螺仪箭头（紫色）
    const gyroArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      5,
      0x7c3aed, // Violet-600
      1,
      0.5
    );
    scene.add(gyroArrow);
    objectsRef.current.gyroArrow = gyroArrow;

    // 创建轨迹线
    const trajectoryGeometry = new THREE.BufferGeometry();
    const trajectoryMaterial = new THREE.LineBasicMaterial({
      color: 0x059669, // Emerald-600
      linewidth: 2
    });
    const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    scene.add(trajectoryLine);
    objectsRef.current.trajectoryLine = trajectoryLine;

    // 添加网格地面
    const gridHelper = new THREE.GridHelper(60, 60, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 窗口大小调整
    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // 更新3D可视化
  const update3DVisualization = (data) => {
    if (!objectsRef.current.cube) return;

    const { accX, accY, accZ, gyroX, gyroY, gyroZ } = data;

    // 更新加速度箭头
    const accVector = new THREE.Vector3(accX, accZ - 9.8, accY).normalize();
    const accLength = Math.min(Math.sqrt(accX ** 2 + accY ** 2 + (accZ - 9.8) ** 2), 10);

    // 更新陀螺仪箭头
    const gyroVector = new THREE.Vector3(gyroX, gyroZ, gyroY).normalize();

    // -- 更新主立方體 (繞圓) --
    const R = 15;
    const omega = 0.5;
    const idealX = R * Math.cos(omega * timeRef.current);
    const idealZ = R * Math.sin(omega * timeRef.current);

    objectsRef.current.cube.position.x = idealX;
    objectsRef.current.cube.position.z = idealZ;
    objectsRef.current.cube.position.y = Math.sin(timeRef.current * 10) * 0.5;

    // 朝向切線
    objectsRef.current.cube.rotation.y = - (omega * timeRef.current);

    // -- 更新第二個立方體 (快速旋轉) --
    if (objectsRef.current.fastCube) {
      objectsRef.current.fastCube.rotation.x += 0.15;
      objectsRef.current.fastCube.rotation.y += 0.25;
      objectsRef.current.fastCube.rotation.z += 0.1;
      // 懸浮動畫
      objectsRef.current.fastCube.position.y = 5 + Math.sin(timeRef.current * 2) * 2;
    }

    // 更新箭頭跟隨主立方體
    objectsRef.current.accArrow.position.copy(objectsRef.current.cube.position);
    objectsRef.current.accArrow.setDirection(accVector);
    objectsRef.current.accArrow.setLength(5, 1, 0.5);

    objectsRef.current.gyroArrow.position.copy(objectsRef.current.cube.position);
    objectsRef.current.gyroArrow.setDirection(gyroVector);
    objectsRef.current.gyroArrow.setLength(5, 1, 0.5);

    // 更新軌跡
    trajectoryRef.current.push(objectsRef.current.cube.position.clone());

    if (trajectoryRef.current.length > 200) {
      trajectoryRef.current.shift();
    }

    const positions = new Float32Array(trajectoryRef.current.length * 3);
    trajectoryRef.current.forEach((pos, i) => {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    });

    objectsRef.current.trajectoryLine.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    objectsRef.current.trajectoryLine.geometry.attributes.position.needsUpdate = true;
  };

  // 数据更新循环
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const data = generateIMUData();
        setCurrentData(data);

        const motion = determineMotionState(data);
        setMotionState(motion.state);

        update3DVisualization(data);

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
  }, [isRunning]);

  const handleReset = () => {
    timeRef.current = 0;
    trajectoryRef.current = [];
    positionRef.current.set(0, 0, 0);
    velocityRef.current.set(0, 0, 0);
    if (objectsRef.current.cube) {
      objectsRef.current.cube.rotation.set(0, 0, 0);
    }
  };

  const getStateColor = () => {
    const motion = determineMotionState(currentData);
    return motion.color;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 p-6 font-sans text-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/50">
          {/* 標題 */}
          <div className="mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-4 tracking-tight">
              <span className="p-3 bg-blue-50 rounded-xl">🎯</span>
              IMU 3D 運動狀態分析
            </h1>
            <p className="text-slate-500 text-lg ml-16">實時3D可視化與智能運動識別系統</p>
          </div>

          {/* 運動狀態顯示 */}
          <div className="mb-8 p-8 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100/50">
            <div className="text-center">
              <div className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-3">當前運動狀態</div>
              <div
                className="text-6xl font-black mb-6 tracking-tight drop-shadow-sm transition-colors duration-300"
                style={{ color: getStateColor() }}
              >
                {motionState}
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                {[
                  { label: '靜止', color: 'bg-green-500' },
                  { label: '緩慢移動', color: 'bg-blue-500' },
                  { label: '正常移動', color: 'bg-yellow-500' },
                  { label: '快速旋轉', color: 'bg-pink-500' },
                  { label: '劇烈運動', color: 'bg-red-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.color} mr-2`}></span>
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 控制按鈕 */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center gap-2 ${isRunning
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                }`}
            >
              <span>{isRunning ? '⏸' : '▶'}</span>
              {isRunning ? '暫停監控' : '開始監控'}
            </button>

            <button
              onClick={handleReset}
              className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all shadow-md border border-slate-200 active:scale-95 flex items-center gap-2"
            >
              <span>🔄</span> 重置系統
            </button>
          </div>

          {/* 3D畫布 */}
          <div className="mb-8 bg-slate-100/50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '500px', display: 'block' }}
            />
            {/* 標籤說明 */}
            <div className="absolute top-4 left-4 bg-white/80 p-3 rounded-xl text-sm shadow-sm backdrop-blur-sm border border-white/50">
              <div className="font-bold text-slate-700 mb-2">IMU 設備監控</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> 設備 A: 繞圓巡檢</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> 設備 B: 快速自檢</div>
            </div>
          </div>

          {/* 數據顯示 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: '加速度 X', value: currentData.accX, unit: 'm/s²', color: 'text-rose-500', bg: 'bg-rose-50' },
              { label: '加速度 Y', value: currentData.accY, unit: 'm/s²', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: '加速度 Z', value: currentData.accZ, unit: 'm/s²', color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: '角速度 X', value: currentData.gyroX, unit: '°/s', color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: '角速度 Y', value: currentData.gyroY, unit: '°/s', color: 'text-violet-500', bg: 'bg-violet-50' },
              { label: '角速度 Z', value: currentData.gyroZ, unit: '°/s', color: 'text-pink-500', bg: 'bg-pink-50' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{item.label}</div>
                <div className={`text-2xl font-mono font-bold ${item.color} flex items-baseline gap-1`}>
                  {item.value.toFixed(2)}
                  <span className="text-slate-400 text-sm font-normal">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 圖例說明 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">🎨</span> 視覺元素說明
              </h3>
              <ul className="text-slate-600 text-sm space-y-3">
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-500 mr-3"></span> 紅色箭頭：加速度方向</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-violet-600 mr-3"></span> 紫色箭頭：角速度方向</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span> 藍色立方體：IMU 設備</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-600 mr-3"></span> 綠色軌跡：歷史運動路徑</li>
              </ul>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span> 運動模式邏輯
              </h3>
              <ul className="text-slate-600 text-sm space-y-3">
                <li className="flex items-start"><span className="mr-2 text-slate-400">•</span> 自動切換：模擬多種運動情境</li>
                <li className="flex items-start"><span className="mr-2 text-slate-400">•</span> 模式：靜止 → 行走 → 跑步 → 旋轉</li>
                <li className="flex items-start"><span className="mr-2 text-slate-400">•</span> 算法：基於加速度向量模長與角速度閾值判斷</li>
                <li className="flex items-start"><span className="mr-2 text-slate-400">•</span> 交互：支持3D視角拖拽與自動旋轉</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMU3DVisualization;
