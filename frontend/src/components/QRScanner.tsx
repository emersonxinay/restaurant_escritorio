import { useEffect, useRef, useState } from 'react';
import { Icon, Icons } from '../utils/icons';

interface QRScannerProps {
  onScan: (qrData: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      return;
    }

    const startCamera = async () => {
      try {
        setError('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsScanning(true);
          startScanning();
        }
      } catch (err: any) {
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        console.error(err);
      }
    };

    if (isOpen) {
      startCamera();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const startScanning = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          // Simple QR detection - look for specific patterns
          // In production, use a library like jsQR or zbar.wasm
          // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // For now, we'll use a text input as fallback
          // A real implementation would decode the QR code here
        } catch (err) {
          console.error('Error scanning:', err);
        }
      }

      if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Escanear Código QR</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon icon={Icons.close} size="lg" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <Icon icon={Icons.error} size="sm" className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Apunta la cámara al código QR de la reserva
          </p>

          {/* Manual ID input as fallback */}
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              O ingresa el ID manualmente:
            </p>
            <input
              type="text"
              placeholder="ID de reserva"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  onScan(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
            />
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
