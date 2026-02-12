import productsJson from "@/data/products.json";
import { Product } from "@/shared/lib/types";

/**
 * Static product catalog fallback for client-only experiences.
 */
export const FALLBACK_PRODUCTS = productsJson as Product[]; // Use JSON fallback until SQL wiring.
