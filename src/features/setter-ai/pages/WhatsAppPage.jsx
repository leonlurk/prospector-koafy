import React, { useEffect, useState } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

function WhatsAppPage() {
  const { 
    currentUser,
    whatsappStatus,
    isLoading,
    connect,
    disconnect,
    checkStatus
  } = useWhatsApp();

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (whatsappStatus.qr) {
      QRCode.toDataURL(whatsappStatus.qr)
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    } else {
      setQrCodeDataUrl('');
    }
  }, [whatsappStatus.qr]);

  useEffect(() => {
    if (currentUser) {
      checkStatus(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (whatsappStatus.status === 'connected') {
      navigate('/agents');
    }
  }, [whatsappStatus.status, navigate]);

  const handleConnect = () => {
    if (currentUser) {
      connect(currentUser.id);
    }
  };

  const handleDisconnect = () => {
    if (currentUser) {
      disconnect(currentUser.id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Connection</h1>
        <p className="text-gray-600">Manage your WhatsApp connection</p>
      </div>

      {whatsappStatus.error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{whatsappStatus.error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Connection Status</h2>
              <p className="text-sm text-gray-500 mt-1">
                Current status: <span className="font-medium">{whatsappStatus.status}</span>
              </p>
            </div>
            <div>
              {whatsappStatus.status === 'connected' ? (
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>

        {whatsappStatus.status === 'connecting' && qrCodeDataUrl && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h3>
            <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
              <img src={qrCodeDataUrl} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Open WhatsApp on your phone and scan this QR code to connect
            </p>
          </div>
        )}

        {whatsappStatus.status === 'connected' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  WhatsApp is connected and ready to use
                </p>
              </div>
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No user is currently selected. Please log in or select a user first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsAppPage; 