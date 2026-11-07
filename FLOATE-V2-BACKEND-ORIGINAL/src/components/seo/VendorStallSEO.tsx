import React from 'react';
import { SEO } from '../common/SEO';
import { createMerchantSlug } from '../../utils/merchantSlug';
import { normalizeWhatsAppNumber } from '../../utils/whatsapp';

export interface VendorStallSEOProps {
  vendorName: string;
  marketLocation: string;
  stallAddress?: string;
  vendorPhone?: string;
  vendorSlug?: string;
  image?: string;
  description?: string;
}

export const VendorStallSEO: React.FC<VendorStallSEOProps> = ({
  vendorName,
  marketLocation,
  stallAddress,
  vendorPhone,
  vendorSlug = "",
  image,
  description
}) => {
  const displayAddress = stallAddress || marketLocation;
  const pageTitle = `${vendorName} — Official Market Stall on FLOATE (${marketLocation})`;
  const pageDescription = description || `${vendorName} located at ${displayAddress} in ${marketLocation}. View catalog, inspect inventory, and chat directly on WhatsApp via FLOATE AI.`;
  const canonicalSlug = createMerchantSlug(vendorName) || vendorSlug || vendorPhone || '';
  const canonicalUrl = `https://www.floate.xyz/vendor/${encodeURIComponent(canonicalSlug)}`;
  const phone = normalizeWhatsAppNumber(vendorPhone);

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${canonicalUrl}#store`,
    "name": vendorName,
    "url": canonicalUrl,
    ...(image ? { "image": image } : {}),
    ...(phone ? { "telephone": `+${phone}` } : {}),
    "description": pageDescription,
    "address": {
      "@type": "PostalAddress",
      ...(stallAddress ? { "streetAddress": stallAddress } : {}),
      "addressLocality": marketLocation,
      "addressCountry": "NG"
    }
  };

  return (
    <SEO
      title={pageTitle}
      description={pageDescription}
      image={image}
      url={canonicalUrl}
      type="store"
      schemaData={storeSchema}
    />
  );
};
