import type { Language } from '@/hooks/useLanguage';

type ShopCopy = {
  pricing: string; search: string; sort: string; results: string; none: string;
  cats: Record<'all' | 'membership' | 'courses' | 'books' | 'christmas', string>;
  sorts: Record<'recommended' | 'priceAsc' | 'priceDesc' | 'name', string>;
};

export const shopCopy: Record<Language, ShopCopy> = {
  de: { pricing: 'Mitgliedschaften & Preise', search: 'Produkte suchen …', sort: 'Sortieren', results: '{n} Produkte', none: 'Keine Produkte gefunden.',
    cats: { all: 'Alle', membership: 'Mitgliedschaften', courses: 'Kurse', books: 'Bücher & Noten', christmas: 'Weihnachten' },
    sorts: { recommended: 'Empfohlen', priceAsc: 'Preis aufsteigend', priceDesc: 'Preis absteigend', name: 'Name A–Z' } },
  en: { pricing: 'Memberships & pricing', search: 'Search products …', sort: 'Sort', results: '{n} products', none: 'No products found.',
    cats: { all: 'All', membership: 'Memberships', courses: 'Courses', books: 'Books & sheet music', christmas: 'Christmas' },
    sorts: { recommended: 'Recommended', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low', name: 'Name A–Z' } },
  es: { pricing: 'Membresías y precios', search: 'Buscar productos …', sort: 'Ordenar', results: '{n} productos', none: 'No se encontraron productos.',
    cats: { all: 'Todos', membership: 'Membresías', courses: 'Cursos', books: 'Libros y partituras', christmas: 'Navidad' },
    sorts: { recommended: 'Recomendados', priceAsc: 'Precio ascendente', priceDesc: 'Precio descendente', name: 'Nombre A–Z' } },
  sl: { pricing: 'Članstva in cene', search: 'Iskanje izdelkov …', sort: 'Razvrsti', results: '{n} izdelkov', none: 'Ni najdenih izdelkov.',
    cats: { all: 'Vse', membership: 'Članstva', courses: 'Tečaji', books: 'Knjige in note', christmas: 'Božič' },
    sorts: { recommended: 'Priporočeno', priceAsc: 'Cena naraščajoče', priceDesc: 'Cena padajoče', name: 'Ime A–Ž' } },
};
