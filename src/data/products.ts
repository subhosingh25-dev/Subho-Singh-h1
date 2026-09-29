export interface Product {
  id: string;
  name: string;
  image: string;
  code: string;
  url: string;
}

// ==========================================
// 🌟 EDIT YOUR 5 PRODUCTS HERE 🌟
// Yahan apne 5 products ke details change kijiye.
// Har naye user ko inme se koi ek random offer dikhegi!
// ==========================================
export const PRODUCTS: Product[] = [
  {
    id: "product-1",
    name: "Floral Cluster Pink Stone Ring", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026IPJ0V6/floral-cluster-pink-stone-ring_1.webp", // <-- 2. Product Image URL
    code: "VBFESTIVEOFF", // <-- 3. Promo Code (30% Off Coupon)
    url: "https://velvetboxs.com/rings/floral-cluster-pink-stone-ring" // <-- 4. Buy Now Product Link
  },
  {
    id: "product-2",
    name: "Ethereal Crown Lightweight Statement Ring", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026IPHTWK/ethereal-crown-lightweight-statement-ring_1.webp", // <-- 2. Product Image URL
    code: "VBFESTIVEOFF", // <-- 3. Promo Code (30% Off Coupon)
    url: "https://velvetboxs.com/rings/ethereal-crown-lightweight-statement-ring" // <-- 4. Buy Now Product Link
  },
  {
    id: "product-3",
    name: "Graceful Pink Stone Statement Ring", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026IP64CA/graceful-pink-stone-statement-ring_1.webp", // <-- 2. Product Image URL (Replace with your CDN URL if needed)
    code: "VBFESTIVEOFF", // <-- 3. Promo Code (30% Off Coupon)
    url: "https://velvetboxs.com/rings/graceful-stone-statement-ring" // <-- 4. Buy Now Product Link
  },
  {
    id: "product-4",
    name: "Blue Floral Enamel Stud Earrings", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026IPORL8/blue-floral-enamel-stud-earrings_1.webp", // <-- 2. Product Image URL
    code: "VBFESTIVEOFF", // <-- 3. Promo Code (30% Off Coupon)
    url: "https://velvetboxs.com/earrings/blue-floral-enamel-stud-earrings" // <-- 4. Buy Now Product Link
  }
];
