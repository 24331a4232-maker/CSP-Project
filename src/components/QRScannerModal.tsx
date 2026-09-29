import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { 
  X, Camera, Upload, Key, CheckCircle2, AlertCircle, 
  Sparkles, Package, MapPin, Clock, ArrowRight, RefreshCw, 
  ShieldCheck, User, Phone, Check, Loader2, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Donation } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  userData: any;
  onVerificationSuccess?: (donation: Donation) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userData,
  onVerificationSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'MANUAL' | 'FILE'>('CAMERA');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedDonation, setVerifiedDonation] = useState<Donation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setVerifiedDonation(null);
      setErrorMessage(null);
      setCameraError(null);
      setManualCode('');
      return;
    }

    if (activeTab === 'CAMERA' && !verifiedDonation) {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [isOpen, activeTab, verifiedDonation]);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false;
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    setErrorMessage(null);

    const readerElement = document.getElementById('qr-modal-reader');
    if (!readerElement) return;

    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        await stopCameraScanner();
      }

      const html5QrCode = new Html5Qrcode('qr-modal-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      isScanningRef.current = true;
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleDecodedToken(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn('Camera scanner initialization issue:', err);
      setCameraError(
        'Camera access not available or blocked in current preview. You can use the "Enter Code" or "Upload Image" tab to verify instantly.'
      );
      isScanningRef.current = false;
    }
  };

  const handleDecodedToken = async (rawDecodedText: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setErrorMessage(null);

    // Stop camera immediately on detection
    await stopCameraScanner();

    try {
      const cleanToken = rawDecodedText.trim();
      let matchedDonation: Donation | null = null;
      let matchedDocId: string | null = null;

      // 1. Direct query by qr_token in Firestore donations
      const tokenQuery = query(collection(db, 'donations'), where('qr_token', '==', cleanToken));
      const tokenSnap = await getDocs(tokenQuery);

      if (!tokenSnap.empty) {
        const firstDoc = tokenSnap.docs[0];
        matchedDocId = firstDoc.id;
        matchedDonation = { id: firstDoc.id, ...firstDoc.data() } as Donation;
      }

      // 2. Query by ID if cleanToken looks like a document ID
      if (!matchedDonation) {
        try {
          const directDoc = await getDoc(doc(db, 'donations', cleanToken));
          if (directDoc.exists()) {
            matchedDocId = directDoc.id;
            matchedDonation = { id: directDoc.id, ...directDoc.data() } as Donation;
          }
        } catch (e) {}
      }

      // 3. Fallback scan: Check food_donations collection
      if (!matchedDonation) {
        try {
          const mirrorQuery = query(collection(db, 'food_donations'), where('qr_token', '==', cleanToken));
          const mirrorSnap = await getDocs(mirrorQuery);
          if (!mirrorSnap.empty) {
            const firstDoc = mirrorSnap.docs[0];
            matchedDocId = firstDoc.id;
            matchedDonation = { id: firstDoc.id, ...firstDoc.data() } as Donation;
          }
        } catch (e) {}
      }

      // 4. Broad scan if token contains embedded ID or prefix
      if (!matchedDonation) {
        const allSnap = await getDocs(collection(db, 'donations'));
        for (const d of allSnap.docs) {
          const data = d.data();
          if (
            data.qr_token === cleanToken ||
            d.id === cleanToken ||
            cleanToken.includes(d.id) ||
            cleanToken.includes(data.qr_token)
          ) {
            matchedDocId = d.id;
            matchedDonation = { id: d.id, ...data } as Donation;
            break;
          }
        }
      }

      if (!matchedDonation || !matchedDocId) {
        setErrorMessage(`No matching food donation found for verification code "${cleanToken}". Please check and try again.`);
        setIsVerifying(false);
        return;
      }

      // Check if already picked up
      if (matchedDonation.status === 'PICKED_UP' || matchedDonation.status === 'COMPLETED') {
        const pickedUpTime = matchedDonation.scanned_at ? new Date(matchedDonation.scanned_at).toLocaleString() : 'earlier';
        toast.error(`This donation was already verified and collected on ${pickedUpTime}.`);
        setVerifiedDonation(matchedDonation);
        setIsVerifying(false);
        return;
      }

      // Perform Verification and State Update
      const nowMs = Date.now();
      const volunteerName = userData?.name || currentUser?.displayName || 'Volunteer';
      const volunteerPhone = userData?.phone || '';
      const volunteerId = currentUser?.uid || 'volunteer-agent';

      const updatePayload: any = {
        status: 'PICKED_UP',
        scanned_at: nowMs,
        volunteer_id: volunteerId,
        volunteer_name: volunteerName,
        volunteer_phone: volunteerPhone,
      };

      // 1. Update donations collection
      await updateDoc(doc(db, 'donations', matchedDocId), updatePayload);

      // 2. Mirror update food_donations
      try {
        await updateDoc(doc(db, 'food_donations', matchedDocId), updatePayload);
      } catch (e) {}

      // 3. Record in pickups audit collection
      try {
        await addDoc(collection(db, 'pickups'), {
          donation_id: matchedDocId,
          donor_id: matchedDonation.donor_id || '',
          donor_name: matchedDonation.donor_organization || matchedDonation.donor_name || 'Donor',
          volunteer_id: volunteerId,
          volunteer_name: volunteerName,
          status: 'COMPLETED',
          food_type: matchedDonation.food_type,
          quantity: matchedDonation.quantity,
          meals: matchedDonation.meals,
          scheduled_time: matchedDonation.pickup_time || new Date().toISOString(),
          scanned_at: nowMs,
          created_at: nowMs
        });
      } catch (e) {}

      // 4. Create Real-Time Notifications for Donor and Admin
      try {
        await addDoc(collection(db, 'notifications'), {
          donation_id: matchedDocId,
          donor_id: matchedDonation.donor_id || '',
          volunteer_id: volunteerId,
          volunteer_name: volunteerName,
          volunteer_phone: volunteerPhone,
          food_type: matchedDonation.food_type,
          quantity: matchedDonation.quantity,
          title: 'Food Donation Picked Up Successfully! 🎉',
          message: `Volunteer ${volunteerName} has successfully verified and collected your food donation "${matchedDonation.food_type}" (${matchedDonation.quantity}). Thank you for your contribution to reducing food waste!`,
          type: 'DONATION_PICKED_UP',
          targetRole: 'donor',
          is_read: false,
          created_at: nowMs
        });
      } catch (e) {
        console.warn('Failed to dispatch notification:', e);
      }

      const updatedRecord: Donation = {
        ...matchedDonation,
        ...updatePayload,
      };

      setVerifiedDonation(updatedRecord);
      toast.success('Food Donation Verified & Collected Successfully! 🎉', { duration: 5000 });
      if (onVerificationSuccess) {
        onVerificationSuccess(updatedRecord);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || 'Failed to verify QR Code. Please check connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Please enter a verification code.');
      return;
    }
    handleDecodedToken(manualCode.trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-modal-reader-file-temp');
      const decodedResult = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      await handleDecodedToken(decodedResult);
    } catch (fileErr: any) {
      console.warn('File scan error:', fileErr);
      setErrorMessage('Could not detect a valid QR Code in the uploaded image. Please try another image or enter the code manually.');
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Hidden temp element for file scanning */}
        <div id="qr-modal-reader-file-temp" className="hidden" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Volunteer QR Verification</h3>
              <p className="text-xs text-gray-500">Scan donor QR code to verify pickup and confirm collection</p>
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

        {/* Verified Result View */}
        {verifiedDonation ? (
          <div className="mt-6 space-y-6 animate-in fade-in duration-300">
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-emerald-950">Pickup Verified & Recorded!</h4>
              <p className="text-xs text-emerald-800 font-medium">
                The food donation has been verified. Status updated to <span className="font-bold">PICKED UP</span>.
              </p>
            </div>

            {/* Donation Summary */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="font-bold text-sm text-gray-900">{verifiedDonation.food_type}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {verifiedDonation.quantity} ({verifiedDonation.meals} meals)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Donor: <strong>{verifiedDonation.donor_organization || verifiedDonation.donor_name || 'Donor'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Location: {verifiedDonation.pickup_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Verified At: {new Date(verifiedDonation.scanned_at || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setVerifiedDonation(null);
                  setActiveTab('CAMERA');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Another Donation</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('CAMERA')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'CAMERA'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MANUAL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'MANUAL'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Enter Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FILE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'FILE'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Camera Tab */}
            {activeTab === 'CAMERA' && (
              <div className="space-y-4">
                {cameraError ? (
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('MANUAL')}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Switch to Enter Code</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl bg-black aspect-square flex items-center justify-center border border-gray-800 shadow-inner">
                    <div id="qr-modal-reader" className="w-full h-full" />
                    
                    {/* Scanning indicator */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-56 h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl relative animate-pulse flex items-center justify-center">
                        <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute top-1/2 -translate-y-1/2 animate-bounce" />
                      </div>
                      <p className="text-white/80 text-xs font-medium mt-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                        Point camera at donor's QR code
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Code Entry Tab */}
            {activeTab === 'MANUAL' && (
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Verification Code or Token
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. FBDN-XXXXX or DONATION_..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[11px] text-gray-500">
                    Enter the code shown directly below the donor's QR code or the Donation ID.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !manualCode.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-xs cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Confirm Pickup</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* File Upload Tab */}
            {activeTab === 'FILE' && (
              <div className="space-y-4 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Upload QR Code Image</p>
                    <p className="text-xs text-gray-500 mt-1">Select a screenshot or photo of the donor's QR code</p>
                  </div>
                </div>

                {isVerifying && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing QR image...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
