import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ProductItem, Merchant } from "../../types/storefront";
import { buildMerchantWhatsAppLink } from "../../utils/whatsapp";

interface SafePayDrawerProps {
  product: ProductItem | null;
  merchant: Merchant;
  isOpen: boolean;
  onClose: () => void;
}

export const SafePayDrawer: React.FC<SafePayDrawerProps> = ({
  product,
  merchant,
  isOpen,
  onClose
}) => {
  if (!product) return null;

  const merchantWhatsAppLink = buildMerchantWhatsAppLink(
    merchant.whatsappNumber,
    `Hi ${merchant.name}, I'm interested in ${product.title} listed for ₦${product.price.toLocaleString()}. How can I arrange an order?`
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden sm:items-center">
          <motion.button
            type="button"
            aria-label="Close checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-coming-soon-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg space-y-5 rounded-t-3xl border border-slate-100 bg-white p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="checkout-coming-soon-title" className="text-base font-bold text-slate-900">
                  Payments are coming soon
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  You can contact the merchant directly to arrange this order.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{product.title}</p>
                <p className="mt-1 text-sm font-extrabold text-slate-700">₦{product.price.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{merchant.name}</p>
              </div>
            </div>

            {merchantWhatsAppLink ? (
              <a
                href={merchantWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0A4D3C] px-4 py-3 text-sm font-bold text-white hover:bg-[#083d30]"
              >
                Contact merchant on WhatsApp
              </a>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">
                The merchant&apos;s WhatsApp contact is unavailable. Please try again later.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
