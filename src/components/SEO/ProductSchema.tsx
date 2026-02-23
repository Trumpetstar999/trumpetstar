import { useEffect } from 'react';

interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  brand?: string;
  price: string;
  currency: string;
  availability?: string;
  url: string;
}

export function ProductSchema({ 
  name, 
  description, 
  image, 
  brand = "Trumpetstar", 
  price, 
  currency, 
  availability = "https://schema.org/InStock",
  url 
}: ProductSchemaProps) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": name,
      "image": image,
      "description": description,
      "brand": {
        "@type": "Brand",
        "name": brand
      },
      "offers": {
        "@type": "Offer",
        "url": url,
        "price": price,
        "priceCurrency": currency,
        "availability": availability
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'product-schema';
    
    const existing = document.getElementById('product-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const schemaElement = document.getElementById('product-schema');
      if (schemaElement) schemaElement.remove();
    };
  }, [name, description, image, brand, price, currency, availability, url]);

  return null;
}

export default ProductSchema;
