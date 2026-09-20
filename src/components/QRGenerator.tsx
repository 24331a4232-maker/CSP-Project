import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  label?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ 
  value, 
  size = 120,
  label = "Scan at pickup" 
}) => {
  if (!value) return null;

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-fit">
      <div className="bg-white p-2 rounded-lg">
        <QRCodeSVG 
          value={value} 
          size={size}
          level="H"
          includeMargin={false}
          className="w-full h-auto"
        />
      </div>
      {label && (
        <p className="text-xs text-gray-500 font-medium mt-3 text-center uppercase tracking-wider">
          {label}
        </p>
      )}
    </div>
  );
};
