import React, { useState, useEffect } from 'react';
import ExpenseTracker from './ExpenseTracker';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

const App = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
  const [notification, setNotification] = useState(null);

  // Controlla connessione internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Controlla stato server
  useEffect(() => {
    const checkServerStatus = async () => {
  try {
    const response = await fetch('/api/expenses');
    if (response.ok) {
      setServerStatus('online');
    } else {
      setServerStatus('offline');
    }
  } catch (error) {
    console.warn('Server check failed:', error);
    setServerStatus('offline');
  }
};

    // Check iniziale
    checkServerStatus();

    // Check periodico ogni 30 secondi
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Mostra notifiche
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Status bar component
  const StatusBar = () => {
    if (!isOnline) {
      return (
        <div className="bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-center">
          <WifiOff className="w-4 h-4 mr-2" />
          Nessuna connessione internet - Modalità offline
        </div>
      );
    }

    if (serverStatus === 'offline') {
      return (
        <div className="bg-yellow-500 text-white px-4 py-2 text-sm flex items-center justify-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Server non raggiungibile - Alcune funzioni potrebbero non funzionare
        </div>
      );
    }

    if (serverStatus === 'checking') {
      return (
        <div className="bg-blue-500 text-white px-4 py-2 text-sm flex items-center justify-center">
          <div className="loading-spinner mr-2"></div>
          Connessione al server in corso...
        </div>
      );
    }

    return null;
  };

  // Notification component
  const Notification = () => {
    if (!notification) return null;

    const bgColor = {
      'success': 'bg-green-500',
      'error': 'bg-red-500',
      'warning': 'bg-yellow-500',
      'info': 'bg-blue-500'
    }[notification.type] || 'bg-blue-500';

    const Icon = {
      'success': CheckCircle,
      'error': AlertCircle,
      'warning': AlertCircle,
      'info': AlertCircle
    }[notification.type] || AlertCircle;

    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center slide-up`}>
        <Icon className="w-5 h-5 mr-2" />
        <span>{notification.message}</span>
        <button 
          onClick={() => setNotification(null)}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className="App">
      <StatusBar />
      <Notification />
      
      <main className="fade-in">
        <ExpenseTracker 
          isOnline={isOnline}
          serverStatus={serverStatus}
          showNotification={showNotification}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span>Expense Tracker Pro v1.0</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
            <span>•</span>
            <span>Server: {serverStatus === 'online' ? '🟢' : serverStatus === 'offline' ? '🔴' : '🟡'}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Gestione avanzata abbonamenti e spese mensili con backup CSV
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;