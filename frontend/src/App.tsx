import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import Admin from './pages/Admin';
import About from './pages/About';
import Promotions from './pages/Promotions';
import Reservations from './pages/Reservations';
import MyReservations from './pages/MyReservations';
import MyOrders from './pages/MyOrders';
import ReservationConfirmation from './pages/ReservationConfirmation';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import NotFound from './pages/NotFound';
import CashierDashboard from './pages/CashierDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import KDS from './pages/KDS';
import AdminReports from './pages/AdminReports';

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode; requireRole?: string[] }) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireRole && requireRole.length > 0 && !hasRole(requireRole)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

import { useEffect, useState } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { resolveResource, appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, copyFile, exists, stat } from '@tauri-apps/plugin-fs';

function App() {
  const [isBackendStarted, setIsBackendStarted] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to start the Node.js sidecar backend when Tauri starts
    const startBackend = async () => {
      try {
        const bundlePath = await resolveResource('_up_/_up_/backend/dist/backend-bundle.cjs');
        
        const appDataPath = await appDataDir();
        
        // Ensure app data directory exists
        try { 
          await mkdir(appDataPath, { recursive: true }); 
        } catch (e: any) {
          console.error("Failed to create appData directory:", e);
        }
        
        const dbPath = await join(appDataPath, 'database.sqlite');
        console.log("DB Path:", dbPath);
        
        // Ensure database is populated with initial data on first run
        try {
          const dbExists = await exists(dbPath);
          let shouldCopy = false;

          if (!dbExists) {
            shouldCopy = true;
          } else {
            // Check if it's an empty database (size < 50KB) left from a failed previous run
            const fileStats = await stat(dbPath);
            if (fileStats.size < 50000) {
              shouldCopy = true;
              console.log("Found empty database, will overwrite with initial data...");
            }
          }

          if (shouldCopy) {
            console.log("Copying initial database from resources to app data...");
            const initialDbPath = await resolveResource('_up_/_up_/database.sqlite');
            await copyFile(initialDbPath, dbPath);
            console.log("Database copied successfully.");
          }
        } catch (dbError: any) {
          console.error("Error copying initial database:", dbError);
          setBackendError("DB Copy Error: " + String(dbError));
          return;
        }
        
        const command = Command.sidecar('binaries/node', [bundlePath], {
          env: { DB_STORAGE: dbPath, PORT: '14234' }
        });
        const child = await command.spawn();
        console.log('Backend sidecar spawned with PID:', child.pid);
        
        command.stdout.on('data', line => console.log(`Backend: ${line}`));
        command.stderr.on('data', line => console.error(`Backend Error: ${line}`));
        
        // Wait for the backend to be fully initialized and listening
        let retries = 20;
        let isHealthy = false;
        while (retries > 0) {
          try {
            const res = await fetch('http://127.0.0.1:14234/health');
            if (res.ok) {
              isHealthy = true;
              break;
            }
          } catch (e) {
            // Ignore connection refused while starting up
          }
          await new Promise(r => setTimeout(r, 500));
          retries--;
        }

        if (!isHealthy) {
          throw new Error("Backend failed to start or respond to health check in time.");
        }
        
        setIsBackendStarted(true);
      } catch (err: any) {
        console.error('Failed to spawn sidecar:', err);
        setBackendError(String(err));
        alert('Failed to spawn sidecar: ' + String(err));
      }
    };
    
    // Check if we are running inside Tauri
    if (typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || window.location.hostname === 'tauri.localhost' || window.location.protocol === 'tauri:')) {
      startBackend();
    }
  }, []);
  const isTauri = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || window.location.hostname === 'tauri.localhost' || window.location.protocol === 'tauri:');

  if (isTauri && !isBackendStarted && !backendError) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><h2>Iniciando servidor local...</h2></div>;
  }
  if (backendError) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'red'}}><h2>Error iniciando backend: {backendError}</h2></div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/carta" element={<Menu />} />
        <Route path="/nosotros" element={<About />} />
        <Route path="/promociones" element={<Promotions />} />
        <Route path="/reservas" element={<Reservations />} />
        <Route path="/reserva-confirmacion/:reservationId" element={<ReservationConfirmation />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

        {/* Protected Routes */}
        <Route
          path="/mis-reservas"
          element={
            <ProtectedRoute>
              <MyReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pedidos"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireRole={['admin']}>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <ProtectedRoute requireRole={['admin', 'cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter"
          element={
            <ProtectedRoute requireRole={['admin', 'waiter', 'cashier']}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kds"
          element={
            <ProtectedRoute requireRole={['admin', 'kitchen', 'bar']}>
              <KDS />
            </ProtectedRoute>
          }
        />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
