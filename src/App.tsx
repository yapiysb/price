import React, { useState, useEffect } from 'react';
import GoogleDrivePriceListManager from './components/GoogleDrivePriceListManager';
import PasswordProtection from './components/PasswordProtection';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kimlik doğrulama durumunu kontrol et
    const authStatus = localStorage.getItem('priceListAuth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('priceListAuth');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="App">
      <GoogleDrivePriceListManager />
      {/* Çıkış butonu - sağ üst köşede */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium shadow-lg z-50"
      >
        Çıkış Yap
      </button>
    </div>
  );
}

export default App;