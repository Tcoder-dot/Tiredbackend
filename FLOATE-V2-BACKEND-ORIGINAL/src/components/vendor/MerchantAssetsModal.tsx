import React from 'react';
import { X, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import { Vendor } from '../../types/floate';
import { FLOATE_BACKEND_URL } from '../../services/backendUrl';

interface MerchantAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
}

export const MerchantAssetsModal: React.FC<MerchantAssetsModalProps> = ({
  isOpen,
  onClose,
  vendor
}) => {
  if (!isOpen) return null;

  const slug = vendor.whatsapp_number || vendor.phone || vendor.slug || "merchant";
  const certificateDownloadUrl = `${FLOATE_BACKEND_URL}/api/credentials/${encodeURIComponent(slug)}/download/certificate`;

  const handleDownloadCertificate = () => {
    const a = document.createElement('a');
    a.href = certificateDownloadUrl;
    a.download = `${slug}-certificate.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#F7F7F2] border-2 border-[#123F16] rounded-[28px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#123F16] to-[#0A290E] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#FFC107]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC107] text-[#123F16] flex items-center justify-center font-extrabold shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Official Certificate of Verification
              </h3>
              <p className="text-xs text-white/70">
                Generated for {vendor.name} ({vendor.city || "Lagos"}, Nigeria)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#123F16] text-[#FFC107] flex items-center justify-center mx-auto shadow-lg border-2 border-[#FFC107]">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h4 className="text-xl font-black text-[#123F16]">{vendor.name}</h4>
            <p className="text-xs text-[#123F16]/70 max-w-md mx-auto leading-relaxed">
              Your business is 100% verified automatically on Floate OS. Download your official certificate featuring your exact business details, phone number, and location.
            </p>
          </div>

          {/* Prominent 1-Tap Download Official Certificate Button */}
          <div className="pt-2">
            <button
              onClick={handleDownloadCertificate}
              className="w-full py-4 px-6 rounded-2xl bg-[#123F16] hover:bg-[#1B5E20] text-[#FFC107] font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer border border-[#FFC107]/30"
            >
              <Download className="w-5 h-5 text-[#FFC107]" />
              <span>Download Official Certificate</span>
            </button>
          </div>

          <p className="text-[11px] text-[#123F16]/60">
            Directly fetched from <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#123F16]/10">/api/credentials/{slug}/download/certificate</code>
          </p>
        </div>
      </div>
    </div>
  );
};
