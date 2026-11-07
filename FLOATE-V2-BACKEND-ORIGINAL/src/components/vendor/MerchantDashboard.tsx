import React, { useState, useEffect } from "react";
import { 
  Store, ShieldCheck, MapPin, Phone, Lock, Plus, Trash2, 
  ArrowLeft, MessageCircle, LogOut, CheckCircle2, 
  Package, AlertCircle, X, Upload, ExternalLink, CreditCard, ShoppingBag, Share2, Pencil
} from "lucide-react";
import { api } from "../../services/api";
import { Product, Vendor } from "../../types/floate";
import { LoadingScreen } from "../common/LoadingScreen";
import { MerchantAssetsModal } from "./MerchantAssetsModal";
import { PricingUpgradeMatrix } from "../PricingUpgradeMatrix";
import { addCatalogProduct, getVendor, updateCatalogProduct, updateCatalogProductCondition } from "../../services/floateApi";
import { buildProductUrl } from "../../utils/productUrl";

interface MerchantDashboardProps {
  merchantSlug: string;
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenStorefront: (slug: string) => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  merchantSlug,
  onLogout,
  onNavigateHome,
  onOpenStorefront
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "profile" | "growth">("catalog");
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

  // New product form state
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Gadgets & Phones");
  const [newCondition, setNewCondition] = useState<"new" | "used" | "refurbished" | "">("");
  const [newPhotoBase64, setNewPhotoBase64] = useState<string>("");
  const [newPhotoPreview, setNewPhotoPreview] = useState<string>("");
  const [newDescription, setNewDescription] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [productError, setProductError] = useState("");
  const [updatingConditionId, setUpdatingConditionId] = useState<string | null>(null);
  const [sharedProductId, setSharedProductId] = useState<string | null>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const isApprovedMerchant = vendor?.isVerified === true || vendor?.verified === true;
  const verificationStatus = vendor?.verificationStatus || (isApprovedMerchant ? "APPROVED" : "PENDING_REVIEW");
  const isRejectedMerchant = verificationStatus === "REJECTED";
  const productLimit = isApprovedMerchant ? 7 : 2;
  const productLimitReached = products.length >= productLimit;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check local storage for custom registered merchants first
        const localMerchants = JSON.parse(localStorage.getItem("floate_merchants") || "[]");
        const foundLocal = localMerchants.find((m: any) => m.slug === merchantSlug);
        let localVendor: Vendor | null = null;

        if (foundLocal) {
          const isVerified = Boolean(foundLocal.verified);
          localVendor = {
            id: foundLocal.id,
            slug: foundLocal.slug,
            name: foundLocal.name,
            city: foundLocal.city,
            state: foundLocal.state,
            category: foundLocal.category,
            verified: isVerified,
            avatar_url: foundLocal.avatar_url || foundLocal.selfieUrl,
            bio: foundLocal.bio,
            whatsapp_number: foundLocal.whatsapp_number,
            verificationStatus: foundLocal.verificationStatus || (isVerified ? "APPROVED" : "PENDING_REVIEW"),
            verificationReason: foundLocal.verificationReason || ""
          };
          setVendor(localVendor);
        }

        const liveProfile = await getVendor(merchantSlug, true).catch(() => null);
        if (liveProfile?.vendor) {
          setVendor({ ...localVendor, ...liveProfile.vendor });
        } else if (localVendor) {
          setVendor(localVendor);
        }

        // Load vendor products
        const pRes = await api.getVendorProducts(merchantSlug);
        if (pRes.success && pRes.products) {
          setProducts(pRes.products);
        }
      } catch (err) {
        console.error("Error loading merchant dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [merchantSlug]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("action") !== "add-product") return;

    setIsAddingProduct(true);
    url.searchParams.delete("action");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) return;
    if (!editingProductId && productLimitReached) {
      setProductError(`Your ${isApprovedMerchant ? "approved" : "pending"} account can list up to ${productLimit} products.`);
      return;
    }

    const vendorPhone = vendor?.whatsapp_number;
    if (!vendorPhone) {
      setProductError("Your WhatsApp number could not be verified. Reload your profile before adding products.");
      return;
    }

    setIsAddingProduct(false);
    setIsLoading(true);
    setProductError("");
    try {
      const payload = {
        vendorPhone,
        name: newTitle.trim(),
        price: newPrice,
        description: newDescription.trim(),
        category: newCategory,
        imageUrl: newPhotoBase64 || undefined,
        condition: newCondition || undefined
      };
      const result = editingProductId
        ? await updateCatalogProduct(editingProductId, payload)
        : await addCatalogProduct(payload);
      if (!result.success || !result.product) {
        throw new Error(result.error || "Product could not be saved.");
      }

      setProducts((current) => editingProductId
        ? current.map((product) => product.id === editingProductId ? result.product! : product)
        : [result.product!, ...current]);
      setNewTitle("");
      setNewPrice("");
      setNewPhotoBase64("");
      setNewPhotoPreview("");
      setNewDescription("");
      setNewCondition("");
      setEditingProductId(null);
      setIsAddingProduct(false);
      setSuccessMessage(editingProductId ? "Product updated in your live catalog." : "Product saved to your live catalog.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setIsAddingProduct(true);
      setProductError(err instanceof Error ? err.message : "Product could not be saved. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setNewTitle(product.title);
    setNewPrice(String(product.price_naira));
    setNewCategory(product.category || "General Merchandise");
    setNewCondition(
      product.condition === "new" || product.condition === "used" || product.condition === "refurbished"
        ? product.condition
        : ""
    );
    setNewPhotoBase64("");
    setNewPhotoPreview(product.photo_url || "");
    setNewDescription(product.description || "");
    setProductError("");
    setIsAddingProduct(true);
  };

  const handleCancelProductForm = () => {
    setIsAddingProduct(false);
    setEditingProductId(null);
    setNewTitle("");
    setNewPrice("");
    setNewPhotoBase64("");
    setNewPhotoPreview("");
    setNewDescription("");
    setNewCondition("");
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleShareProduct = async (product: Product) => {
    const url = buildProductUrl(product.id, vendor?.name || vendor?.slug || merchantSlug);
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, text: `Check out ${product.title} on FLOATE.`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setSharedProductId(product.id);
      setTimeout(() => setSharedProductId(null), 2500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setProductError("The product link could not be shared. Please copy the product URL from its storefront page.");
    }
  };

  const handleUpdateCondition = async (
    productId: string,
    condition: "new" | "used" | "refurbished"
  ) => {
    const vendorPhone = vendor?.whatsapp_number;
    if (!vendorPhone) {
      setProductError("Your WhatsApp number could not be verified. Reload your profile before updating products.");
      return;
    }

    setUpdatingConditionId(productId);
    setProductError("");
    const result = await updateCatalogProductCondition(productId, vendorPhone, condition);
    if (result.success) {
      setProducts((current) => current.map((product) =>
        product.id === productId ? { ...product, condition } : product
      ));
      setSuccessMessage("Product condition saved for the Google product feed.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setProductError(result.error || "Product condition could not be saved.");
    }
    setUpdatingConditionId(null);
  };

  const handleOpenWhatsappAI = () => {
    const rawDigits = (vendor?.whatsapp_number || vendor?.phone || "08031112222").replace(/[^0-9]/g, "");
    const intlPhone = rawDigits.startsWith("0") ? "234" + rawDigits.slice(1) : (rawDigits.startsWith("234") ? rawDigits : "234" + rawDigits);
    window.open(`https://wa.me/2349115162081?text=${encodeURIComponent(`SYNC_CATALOG:${intlPhone}`)}`, '_blank');
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setNewPhotoBase64(base64);
      setNewPhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading Merchant Operating System..." />;
  }

  const facePhotoUrl = vendor?.avatar_url || vendor?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#123F16] font-sans antialiased pb-20">
      {/* ── HEADER BAR ── */}
      <header className="bg-[#123F16] text-white py-4 px-4 sm:px-8 border-b border-[#FFC107]/20 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
              title="Return Home"
            >
              <ArrowLeft className="w-5 h-5 text-[#FFC107]" />
            </button>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#FFC107]" />
              <span className="font-extrabold text-sm sm:text-base tracking-tight">Merchant OS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {vendor && (
              <button
                onClick={() => onOpenStorefront(vendor.slug)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition text-white border border-white/20 cursor-pointer"
              >
                <span>View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FFC107]" />
              </button>
            )}

            <button
              onClick={() => setActiveTab("growth")}
              className="px-3.5 py-1.5 rounded-full bg-[#FFC107] hover:bg-[#ffcd38] text-[#123F16] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Reach More Customers</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-red-500/30"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

        {!isApprovedMerchant && (
          <div className={`rounded-2xl border p-4 sm:p-5 ${isRejectedMerchant ? "bg-red-50 border-red-200 text-red-900" : "bg-amber-50 border-amber-200 text-amber-950"}`} role="status">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h2 className="text-sm font-extrabold">{isRejectedMerchant ? "Business not approved" : "Business verification pending"}</h2>
                <p className="text-xs leading-relaxed">
                  {isRejectedMerchant
                    ? vendor?.verificationReason || "Your account is not verified. Your existing products remain listed, but the account is limited to two products."
                    : "Your business is under review. You can list up to two products; we’ll notify you on WhatsApp when your review is complete."}
                </p>
                <p className="text-xs font-bold">Products: {products.length} / {productLimit}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* ── LARGE MERCHANT PROFILE HERO CARD (Showcases KYC Face Selfie) ── */}
        <div className="bg-gradient-to-r from-[#123F16] via-[#1B5E20] to-[#0A4D3C] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 border-2 border-[#FFC107]/30">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 relative z-10 w-full md:w-auto">
            
            {/* LARGE FACE CARD (KYC Selfie Avatar) */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-[#FFC107] p-1 shadow-xl overflow-hidden border-2 border-white/80 transition-transform duration-300 group-hover:scale-[1.02]">
                <img 
                  src={facePhotoUrl} 
                  alt={vendor?.name || "Merchant Face"} 
                  className="w-full h-full object-cover rounded-[22px]" 
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#123F16] text-[#FFC107] border border-[#FFC107] text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 text-[#2E7D32] fill-[#FFC107]" />
                <span>{isApprovedMerchant ? "Floate Verified" : isRejectedMerchant ? "Not Verified" : "Review Pending"}</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{vendor?.name || "Market Merchant"}</h1>
                {isApprovedMerchant ? (
                  <span className="bg-[#E8F5E9] text-[#123F16] font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-[#2E7D32]/30 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-[#2E7D32]" /> Verified Market Stall
                  </span>
                ) : (
                  <span className="bg-[#FFC107] text-[#123F16] font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <AlertCircle className="w-4 h-4" /> {isRejectedMerchant ? "Not Verified" : "Under Review"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs font-semibold text-white/90 flex-wrap">
                <span className="flex items-center gap-1 text-[#FFC107]">
                  <MapPin className="w-4 h-4" />
                  <span>{vendor?.city || "Lagos"}, Nigeria</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 px-3 py-1 rounded-full text-xs font-black">
                  <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#123F16]" />
                  <span>WhatsApp: {vendor?.whatsapp_number || vendor?.phone || "08031112222"}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl leading-relaxed">
                {vendor?.bio || "Verified physical market stall on Floate Africa. Direct customer inspection & rapid WhatsApp orders."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3 w-full md:w-auto relative z-10 shrink-0">
            <button
              onClick={() => setIsAssetsModalOpen(true)}
              className="px-5 py-3.5 rounded-2xl bg-[#FFC107] hover:bg-[#FFD54F] text-[#123F16] border border-[#FFC107]/50 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-[#123F16]" />
              <span>🛡️ Download Verified Kit & Assets</span>
            </button>
            <button
              onClick={handleOpenWhatsappAI}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-[#FFC107]" />
              <span>Sync via WhatsApp AI</span>
            </button>
          </div>
        </div>

        {/* ── STATS CARDS (3 Clean Columns, No Credits) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#123F16]/10 rounded-2xl p-5 shadow-xs space-y-1">
            <span className="text-xs font-extrabold text-[#2E7D32] uppercase tracking-wider">LIVE STALL CATALOG</span>
            <div className="text-2xl font-black text-[#123F16] flex items-center justify-between">
              <span>{products.length} Items</span>
              <span className="text-xs font-bold text-[#123F16] bg-[#FFF8E1] px-2.5 py-1 rounded-full border border-[#FFC107]/40">Active</span>
            </div>
            <p className="text-[11px] text-[#123F16]/60">Searchable across Floate market feed</p>
          </div>

          <div className="bg-white border border-[#123F16]/10 rounded-2xl p-5 shadow-xs space-y-1">
            <span className="text-xs font-extrabold text-[#2E7D32] uppercase tracking-wider">STORE VERIFICATION</span>
            <div className="text-2xl font-black text-[#123F16] flex items-center justify-between">
              <span>{isApprovedMerchant ? "Verified Stall" : isRejectedMerchant ? "Not Approved" : "Under Review"}</span>
              {isApprovedMerchant ? <ShieldCheck className="w-5 h-5 text-[#2E7D32]" /> : <AlertCircle className="w-5 h-5 text-amber-700" />}
            </div>
            <p className="text-[11px] text-[#123F16]/60">
              {isApprovedMerchant ? "Your business verification is approved." : isRejectedMerchant ? "Your business is not currently verified." : "Your business is awaiting review."}
            </p>
          </div>

          <div className="bg-white border border-[#123F16]/10 rounded-2xl p-5 shadow-xs space-y-1">
            <span className="text-xs font-extrabold text-[#2E7D32] uppercase tracking-wider">CUSTOMER ORDERS</span>
            <div className="text-2xl font-black text-[#123F16] flex items-center justify-between">
              <span>Direct WhatsApp</span>
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <p className="text-[11px] text-[#123F16]/60">Buyers message you directly without middleman fees</p>
          </div>
        </div>

        {/* ── TABS HEADER & ACTIONS ── */}
        <div className="flex items-center justify-between border-b border-[#123F16]/15 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-[#123F16] text-[#FFC107] shadow-xs"
                  : "bg-white text-[#123F16]/70 hover:bg-[#E8F5E9] hover:text-[#123F16] border border-[#123F16]/10"
              }`}
            >
              🛍️ Product Catalog ({products.length})
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#123F16] text-[#FFC107] shadow-xs"
                  : "bg-white text-[#123F16]/70 hover:bg-[#E8F5E9] hover:text-[#123F16] border border-[#123F16]/10"
              }`}
            >
              🔒 Locked Profile & KYC
            </button>

            <button
              onClick={() => setActiveTab("growth")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "growth"
                  ? "bg-[#123F16] text-[#FFC107] shadow-xs"
                  : "bg-white text-[#123F16]/70 hover:bg-[#E8F5E9] hover:text-[#123F16] border border-[#123F16]/10"
              }`}
            >
              🚀 Reach More Customers
            </button>
          </div>
        </div>

        {/* Tab 1: Catalog */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#123F16]">Your Storefront Inventory</h2>
              <button
                disabled={productLimitReached}
                onClick={() => {
                  handleCancelProductForm();
                  setIsAddingProduct(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#123F16] hover:bg-[#1B5E20] text-[#FFC107] text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title={productLimitReached ? `Product limit reached (${productLimit})` : "Add a product"}
              >
                <Plus className="w-4 h-4" />
                <span>{productLimitReached ? "Limit Reached" : `Add Product (${products.length}/${productLimit})`}</span>
              </button>
            </div>

            {/* Success Notification */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/30 text-xs font-extrabold text-[#123F16] flex items-center justify-between animate-fade-in">
                <span>{successMessage}</span>
                <button onClick={() => setSuccessMessage("")} className="text-[#123F16]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {productError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-xs font-bold text-red-800">
                {productError}
              </div>
            )}

            {/* Add Product Modal Form */}
            {isAddingProduct && (
              <div className="bg-white border-2 border-[#123F16]/20 rounded-2xl p-6 shadow-md space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#123F16]/10 pb-3">
                  <h3 className="text-sm font-extrabold text-[#123F16] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#FFC107]" /> {editingProductId ? "Edit Catalog Item" : "Add New Item to Live Catalog"}
                  </h3>
                  <button onClick={handleCancelProductForm} className="text-[#123F16]/60 hover:text-[#123F16]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-[#123F16]/80">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. iPhone 15 Pro Max 256GB"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-[#123F16]/80">Price (₦ Naira) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 1250000"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-[#123F16]/80">Item condition (Google product feed)</label>
                    <select
                      value={newCondition}
                      onChange={(e) => {
                        const condition = e.target.value;
                        if (condition === "new" || condition === "used" || condition === "refurbished" || condition === "") {
                          setNewCondition(condition);
                        }
                      }}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value="">Select condition</option>
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                    <p className="text-[10px] text-slate-500">Choose accurately. Listings without condition, description, or a public image are excluded from the Google feed.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-[#123F16]/80">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-800 bg-white"
                      >
                        {!["Gadgets & Phones", "Fashion & Fabrics", "Beauty & Cosmetics", "Food & Commodities", "Home & General"].includes(newCategory) && (
                          <option value={newCategory}>{newCategory}</option>
                        )}
                        <option value="Gadgets & Phones">Gadgets & Phones</option>
                        <option value="Fashion & Fabrics">Fashion & Fabrics</option>
                        <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                        <option value="Food & Commodities">Food & Commodities</option>
                        <option value="Home & General">Home & General</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-[#123F16]/80">Product Photo Upload</label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={galleryFileInputRef}
                        onChange={handleGalleryFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="w-full h-11 px-3.5 rounded-xl border border-dashed border-[#123F16]/30 hover:border-[#123F16] bg-[#F7F7F2] text-xs font-bold text-[#123F16] flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-[#FFC107]" />
                        <span>{newPhotoPreview ? "Change Photo" : "Upload Product Photo"}</span>
                      </button>
                    </div>
                  </div>

                  {newPhotoPreview && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-300 relative">
                      <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setNewPhotoPreview(""); setNewPhotoBase64(""); }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-[#123F16]/80">Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Brand new sealed with 1 year warranty, direct physical stall pickup available."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-[#123F16] hover:bg-[#1B5E20] text-[#FFC107] font-extrabold text-xs transition cursor-pointer shadow-xs"
                    >
                      {editingProductId ? "Save Changes" : "Publish Item"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProductForm}
                      className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((prod) => (
                <div key={prod.id} className="bg-white border border-[#123F16]/10 rounded-2xl p-3 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100">
                    <img src={prod.photo_url || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&auto=format&fit=crop&q=80"} alt={prod.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-[#123F16] line-clamp-1">{prod.title}</h4>
                    <span className="text-xs font-black text-[#2E7D32] tabular-nums block">{prod.formatted_price}</span>
                  </div>

                  <select
                    aria-label={`Set ${prod.title} condition for the Google product feed`}
                    value={prod.condition === "new" || prod.condition === "used" || prod.condition === "refurbished" ? prod.condition : ""}
                    disabled={updatingConditionId === prod.id}
                    onChange={(event) => {
                      const condition = event.target.value;
                      if (condition === "new" || condition === "used" || condition === "refurbished") {
                        void handleUpdateCondition(prod.id, condition);
                      }
                    }}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-700 bg-white disabled:opacity-60"
                  >
                    <option value="">Set item condition</option>
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#123F16]/60 uppercase">{prod.category || "General"}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(prod)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-[#123F16] hover:bg-[#E8F5E9]"
                        title="Edit product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleShareProduct(prod)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-[#123F16] hover:bg-[#E8F5E9]"
                        title="Share this product"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {sharedProductId === prod.id ? "Shared" : "Share"}
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === "profile" && (
          <div className="bg-white border border-[#123F16]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#123F16]/10 pb-3">
              <Lock className="w-4 h-4 text-[#FFC107]" />
              <h3 className="text-sm font-extrabold text-[#123F16]">Locked Merchant KYC Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#123F16]/60 font-bold block">Business Handle</span>
                <span className="font-extrabold text-[#123F16]">@{vendor?.slug || merchantSlug}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[#123F16]/60 font-bold block">WhatsApp Number</span>
                <span className="font-extrabold text-[#123F16]">{vendor?.whatsapp_number || "Not set"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[#123F16]/60 font-bold block">Physical Location</span>
                <span className="font-extrabold text-[#123F16]">{vendor?.city}, Nigeria</span>
              </div>

              <div className="space-y-1">
                <span className="text-[#123F16]/60 font-bold block">Verification Status</span>
                <span className="font-extrabold text-[#2E7D32] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Verified Market Business</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reach More Customers (Paused Pricing / Ads Coming Soon) */}
        {activeTab === "growth" && (
          <div className="bg-white border border-[#123F16]/10 rounded-3xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#FFF8E1] text-[#123F16] flex items-center justify-center mx-auto border border-[#FFC107]">
              <MessageCircle className="w-7 h-7 text-[#FFC107] fill-[#123F16]" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-black text-[#123F16]">Sponsored Search & Ads</h3>
              <p className="text-xs text-[#123F16]/70 font-medium leading-relaxed">
                Your store is free. Floate will support sponsored ad placements soon.
              </p>
            </div>
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-xs font-extrabold border border-[#2E7D32]/30">
              ✦ All organic market indexing & direct buyer WhatsApp orders remain 100% Free
            </div>
          </div>
        )}
      </main>

      {/* Verified Assets Modal */}
      {vendor && (
        <MerchantAssetsModal
          isOpen={isAssetsModalOpen}
          onClose={() => setIsAssetsModalOpen(false)}
          vendor={vendor}
        />
      )}

    </div>
  );
};
