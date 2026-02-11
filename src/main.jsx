import React from 'react'
import ReactDOM from 'react-dom/client'
import IMU3DVisualization from './imu-3d-visualization'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <IMU3DVisualization />
    </React.StrictMode>,
)
