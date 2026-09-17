export interface NavItem {
  etiqueta: string;
  href: string;
}

/**
 * Fuente única de la navegación. Header y Footer leen de aquí — no dupliques
 * la lista en ningún componente.
 */
export const navPrincipal: NavItem[] = [
  { etiqueta: 'Inicio', href: '/' },
  { etiqueta: 'Servicios', href: '/servicios' },
  { etiqueta: 'Portafolio', href: '/portafolio' },
  { etiqueta: 'Nosotros', href: '/sobre-nosotros' },
  { etiqueta: 'Contacto', href: '/contacto' },
];
