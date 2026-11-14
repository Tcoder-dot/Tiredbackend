import React from 'react';
import { SEO } from '../common/SEO';
import { buildProductUrl } from '../../utils/productUrl';

export interface ProductSEOProps {
  productTitle: string;
  price: number | string;
  vendorName: string;
  marketLocation: string;
  productSlug: string;
  image?: string;
  description?: string;
  category?: string;
  stallAddress?: string;
  vendorPhone?: string;
}

export const ProductSEO: React.FC<ProductSEOProps> = ({
  productTitle,
  price,
  vendorName,
  marketLocation,
  productSlug,
  image,
  description,
  category = "Commerce",
  stallAddress = marketLocation,
  vendorPhone
}) => {
  const formattedPrice = typeof price === "number" ? price.toLocaleString("en-NG") : price;
  const numericPrice = typeof price === "number"
    ? price
    : Number(String(price).replace(/[^0-9.]/g, ""));
  const pageTitle = `Buy ${productTitle} in Nigeria — ₦${formattedPrice} | ${vendorName} (${marketLocation})`;
  const pageDescription = description
    ? `${description} — Available for ₦${formattedPrice} from ${vendorName} at ${marketLocation}. Contact the seller directly through FLOATE.`
    : `Buy ${productTitle} for ₦${formattedPrice} from ${vendorName} at ${marketLocation}, Nigeria. View listing details and contact the seller directly through FLOATE.`;
  const canonicalUrl = buildProductUrl(productSlug, vendorName, productTitle);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    url: canonicalUrl,
    sku: productSlug,
    name: productTitle,
    ...(image ? { image: [image] } : {}),
    description: pageDescription,
    category,
    ...(Number.isFinite(numericPrice) && numericPrice > 0
      ? {
          offers: {
            "@type": "Offer",
            url: canonicalUrl,
            priceCurrency: "NGN",
            price: numericPrice,
            seller: {
              "@type": "Store",
              name: vendorName,
              ...(vendorPhone ? { telephone: vendorPhone } : {}),
              address: {
                "@type": "PostalAddress",
                ...(stallAddress ? { streetAddress: stallAddress } : {}),
                addressLocality: marketLocation,
                addressCountry: "NG"
              }
            }
          }
        }
      : {})
  };

  return (
    <SEO
      title={pageTitle}
      description={pageDescription}
      image={image}
      url={canonicalUrl}
      type="product"
      schemaData={productSchema}
    />
  );
};
