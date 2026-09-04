import { describe, it, expect } from 'vitest';
import { categoryIcon, ICON_NAMES } from './categoryIcon';

describe('icono de categoría', () => {
  it('devuelve el icono pedido', () => {
    expect(categoryIcon('Home')).toBe(categoryIcon('Home'));
    expect(categoryIcon('Home')).not.toBe(categoryIcon('Car'));
  });

  it('cae en uno genérico si el nombre no existe', () => {
    // Una categoría sin icono, o con uno renombrado, no debe romper la UI
    expect(categoryIcon('NoExiste')).toBe(categoryIcon(null));
    expect(categoryIcon(undefined)).toBe(categoryIcon(''));
  });

  it('cubre todos los iconos que siembra el backend', () => {
    // Si alguien agrega una categoría por defecto con un icono nuevo y olvida
    // añadirlo acá, se vería como una etiqueta genérica sin ningún error.
    const sembrados = [
      'Home', 'Zap', 'ShoppingCart', 'Car', 'HeartPulse', 'GraduationCap',
      'PawPrint', 'UtensilsCrossed', 'Ticket', 'Repeat', 'ShoppingBag',
      'Shirt', 'Plane', 'CreditCard', 'PiggyBank', 'TrendingUp',
      'TriangleAlert', 'Gift', 'Landmark', 'Briefcase', 'Store', 'Sparkles',
      'Laptop', 'Smartphone', 'Building2',
    ];
    for (const n of sembrados) {
      expect(ICON_NAMES, `falta ${n}`).toContain(n);
    }
  });
});
