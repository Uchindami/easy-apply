import { useState, useEffect } from 'react';

export default function SSEDemo() {
  const [data, setData] = useState({ counter: 0, timestamp: '' });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource('http://localhost:8080/events');
    
    eventSource.onopen = () => {
      setConnected(true);
      setError('');
      console.log('SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
        setError('Error parsing server data');
      }
    };
    
    eventSource.onerror = (event) => {
      console.error('SSE error:', event);
      setConnected(false);
      setError('Connection error - make sure Go server is running on :8080');
    };
    
    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Go SSE Demo
        </h1>
        
        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg border-2 border-dashed">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Status:</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`font-medium ${
                connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <p className="text-red-600 text-xs mt-1">
              Run: go run main.go
            </p>
          </div>
        )}

        {/* Data Display */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Live Counter</h3>
            <div className="text-4xl font-bold text-indigo-600 text-center">
              {data.counter}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Last Update</h3>
            <div className="text-lg text-gray-600 text-center font-mono">
              {data.timestamp || 'No data yet'}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Save Go code as main.go</li>
            <li>2. Create static/ directory</li>
            <li>3. Save React build as index.html in static/</li>
            <li>4. Run: go run main.go</li>
            <li>5. Open: http://localhost:8080</li>
          </ol>
        </div>
      </div>
    </div>
  );
}