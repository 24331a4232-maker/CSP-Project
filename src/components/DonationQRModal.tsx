import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, Copy, Check, QrCode, ShieldCheck, MapPin, Clock, Package, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Donation } from '../types';

interface DonationQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
}

export const DonationQRModal: React.FC<DonationQRModalProps> = ({
  isOpen,
  onClose,
  donation,
}) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !donation) return null;

  const isPickedUp = donation.status === 'PICKED_UP' || donation.status === 'COMPLETED';
  const isAssigned = donation.status === 'ASSIGNED';
  const qrValue = donation.qr_token || `FBDN-${donation.id}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    toast.success('Verification code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) {
      toast.error('Unable to find QR code element');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 600;
        canvas.height = 700;

        if (ctx) {
          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Header
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FoodBridge Donation Verification', 300, 45);

          ctx.fillStyle = '#4B5563';
          ctx.font = '16px sans-serif';
          ctx.fillText(`${donation.food_type} (${donation.quantity})`, 300, 75);

          // Draw QR Code centered
          ctx.drawImage(img, 150, 100, 300, 300);

          // Code text
          ctx.fillStyle = '#1E1B4B';
          ctx.font = 'bold 18px monospace';
          ctx.fillText(qrValue, 300, 430);

          // Details box
          ctx.fillStyle = '#F3F4F6';
          ctx.fillRect(40, 460, 520, 180);

          ctx.fillStyle = '#374151';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Donor: ${donation.donor_organization || donation.donor_name || 'Donor'}`, 60, 490);
          ctx.fillText(`Meals: ${donation.meals} servings`, 60, 520);
          ctx.fillText(`Location: ${donation.pickup_location}`, 60, 550);
          ctx.fillText(`Created: ${new Date(donation.created_at).toLocaleString()}`, 60, 580);
          ctx.fillText(`Status: ${donation.status}`, 60, 610);

          // Footer
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Present this QR code to the authorized volunteer at pickup.', 300, 675);

          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `FoodBridge-QR-${donation.food_type.replace(/\s+/g, '_')}-${donation.id.slice(0, 6)}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          toast.success('QR Code image downloaded successfully!');
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Download QR Error:', err);
      toast.error('Failed to export QR code image.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pickup Verification Pass</h3>
              <p className="text-xs text-gray-500">Unique QR Code for volunteer pickup confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className="mt-4">
          {isPickedUp ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Verified & Collected!</span>
                <p className="text-xs text-emerald-700 mt-0.5">
                  This donation was successfully scanned and verified by volunteer {donation.volunteer_name || 'on duty'}.
                </p>
              </div>
            </div>
          ) : isAssigned ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-sm font-medium">
              <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">Volunteer Assigned: {donation.volunteer_name || 'In Transit'}</span>
                <p className="text-xs text-blue-700 mt-0.5">
                  Have this QR code ready on your screen or printed when the volunteer arrives.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-sm font-medium">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Awaiting Volunteer Assignment</span>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your donation is live on the network. Show this QR code to the volunteer when they arrive.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="mt-6 flex flex-col items-center justify-center p-6 bg-gray-50/80 rounded-2xl border border-gray-200/80">
          <div 
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center"
          >
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={false}
              className="w-48 h-48 sm:w-52 sm:h-52"
            />
          </div>

          {/* Verification Code */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Verification Code:</span>
            <code className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-gray-200 text-gray-800">
              {qrValue}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded transition-colors cursor-pointer"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Donation Summary Card */}
        <div className="mt-4 p-4 rounded-xl bg-white border border-gray-100 space-y-2 text-xs text-gray-600 shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="font-bold text-sm text-gray-900">{donation.food_type}</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
              {donation.quantity} ({donation.meals} meals)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{donation.pickup_location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>Pickup: {new Date(donation.pickup_time).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
