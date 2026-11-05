import type { Language } from '@/hooks/useLanguage';

export const adminShopCopy = {
  de: { title: 'Shop-Produkte', visible: 'Sichtbar', hidden: 'Ausgeblendet', hide: 'Produkt ausblenden', show: 'Produkt einblenden', savedHidden: 'Produkt ausgeblendet', savedVisible: 'Produkt eingeblendet', error: 'Änderung konnte nicht gespeichert werden.', loadError: 'Produkte konnten nicht geladen werden.', price: 'Preis', position: 'Reihenfolge', new: 'NEU', cover: 'Cover' },
  en: { title: 'Shop products', visible: 'Visible', hidden: 'Hidden', hide: 'Hide product', show: 'Show product', savedHidden: 'Product hidden', savedVisible: 'Product visible', error: 'Could not save the change.', loadError: 'Could not load products.', price: 'Price', position: 'Order', new: 'NEW', cover: 'Cover' },
  es: { title: 'Productos de la tienda', visible: 'Visible', hidden: 'Oculto', hide: 'Ocultar producto', show: 'Mostrar producto', savedHidden: 'Producto oculto', savedVisible: 'Producto visible', error: 'No se pudo guardar el cambio.', loadError: 'No se pudieron cargar los productos.', price: 'Precio', position: 'Orden', new: 'NUEVO', cover: 'Portada' },
  sl: { title: 'Izdelki trgovine', visible: 'Vidno', hidden: 'Skrito', hide: 'Skrij izdelek', show: 'Prikaži izdelek', savedHidden: 'Izdelek je skrit', savedVisible: 'Izdelek je viden', error: 'Spremembe ni bilo mogoče shraniti.', loadError: 'Izdelkov ni bilo mogoče naložiti.', price: 'Cena', position: 'Vrstni red', new: 'NOVO', cover: 'Naslovnica' },
} satisfies Record<Language, Record<string, string>>;

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
