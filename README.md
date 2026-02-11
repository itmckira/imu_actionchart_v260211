# IMU 3D 動作分析與可視化系統 (IMU Action Chart)

這是一個基於 React、Three.js 和 Tailwind CSS 開發的實時 IMU（慣性測量單元）傳感器數據可視化儀表板。

## 🌟 專案特色

*   **實時 3D 可視化**：利用 Three.js 渲染 IMU 設備的姿態與運動軌跡。
*   **雙 IMU 模擬展示**：
    *   **主設備 (藍色)**：模擬繞圓巡檢路徑，展示向心加速度與切線方向旋轉。
    *   **副設備 (紅色)**：模擬快速自轉狀態，展示高頻動態響應。
*   **北歐極簡設計 (Nordic Style)**：採用 Slate/Gray 色系漸變背景，搭配玻璃擬態 (Glassmorphism) 卡片設計，提供清晰舒適的視覺體驗。
*   **智能狀態識別**：根據加速度與角速度數據，自動識別「靜止、緩慢移動、正常移動、快速旋轉、劇烈運動」等狀態。
*   **多維數據監控**：實時顯示三軸加速度 (Acc) 與三軸角速度 (Gyro) 數值及動態變化的可視化箭頭。

## 🛠️ 技術棧

*   **Frontend Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **3D Graphics**: [Three.js](https://threejs.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🚀 快速開始

### 1. 安裝依賴

首先，確保您的環境已安裝 Node.js。然後在專案目錄下執行：

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

啟動後，瀏覽器將自動打開 `http://localhost:5173/` (或終端機顯示的其他端口)。

### 3. 建置生產版本

```bash
npm run build
```

## 🎮 操作說明

*   **開始/暫停**：點擊控制欄的按鈕可暫停或繼續數據模擬。
*   **重置系統**：清除歷史軌跡並重置時間軸。
*   **視角控制**：在 3D 畫布區域，您可以：
    *   **左鍵拖拽**：旋轉視角
    *   **右鍵拖拽**：平移視角
    *   **滾輪滾動**：縮放視角

## 📝 授權

MIT License
