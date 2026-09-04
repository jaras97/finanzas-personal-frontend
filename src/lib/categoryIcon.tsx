import {
  Briefcase, Building2, Car, CreditCard, Gift, GraduationCap, HeartPulse,
  Home, Landmark, Laptop, PawPrint, PiggyBank, Plane, Repeat, Shirt,
  ShoppingBag, ShoppingCart, Smartphone, Sparkles, Store, Ticket,
  TrendingUp, TriangleAlert, UtensilsCrossed, Zap, Tag,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icono de una categoría.
 *
 * El backend guarda el NOMBRE del icono (`"Home"`, `"Car"`...), no el
 * componente. Este mapa es explícito a propósito en vez de importar todo
 * lucide dinámicamente: son 25 iconos conocidos, y un import dinámico metería
 * el paquete entero en el bundle para no ganar nada.
 *
 * Cualquier nombre desconocido cae en `Tag`, así que una categoría creada a
 * mano (sin icono) o con un nombre viejo nunca rompe la interfaz.
 */
const ICONS: Record<string, LucideIcon> = {
  Briefcase, Building2, Car, CreditCard, Gift, GraduationCap, HeartPulse,
  Home, Landmark, Laptop, PawPrint, PiggyBank, Plane, Repeat, Shirt,
  ShoppingBag, ShoppingCart, Smartphone, Sparkles, Store, Ticket,
  TrendingUp, TriangleAlert, UtensilsCrossed, Zap,
};

export const ICON_NAMES = Object.keys(ICONS);

export function categoryIcon(nombre?: string | null): LucideIcon {
  if (!nombre) return Tag;
  return ICONS[nombre] ?? Tag;
}
