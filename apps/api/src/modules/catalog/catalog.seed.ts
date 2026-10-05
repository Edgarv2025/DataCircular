import { prisma } from '../../database/prisma';

export const INITIAL_UNITS = [
  { name: 'Kilogramo', abbreviation: 'kg' },
  { name: 'Tonelada', abbreviation: 'ton' },
  { name: 'Unidad', abbreviation: 'und' },
  { name: 'Litro', abbreviation: 'l' },
  { name: 'Metro cúbico', abbreviation: 'm3' },
  { name: 'Bulto/Saco', abbreviation: 'bulto' },
];

export const INITIAL_CATEGORIES = [
  {
    name: 'Plásticos',
    description: 'Polímeros sintéticos y termoplásticos aprovechables',
    subcategories: [
      { name: 'PET (botellas transparentes, de color, contaminadas con aceite)', description: 'Polietileno tereftalato' },
      { name: 'PEAD / HDPE (rígido limpio, rígido sucio)', description: 'Polietileno de alta densidad' },
      { name: 'PVC', description: 'Policloruro de vinilo rígido y flexible' },
      { name: 'PEBD / LDPE (film, bolsas)', description: 'Polietileno de baja densidad' },
      { name: 'PP (Polipropileno)', description: 'Tapas, envases y rafia' },
      { name: 'PS (Poliestireno / icopor)', description: 'Poliestireno expandido y cristal' },
      { name: 'Mezclados / no identificados', description: 'Otros plásticos post-consumo mezclados' },
    ],
  },
  {
    name: 'Metales',
    description: 'Metales ferrosos y no ferrosos con alto potencial de reciclaje',
    subcategories: [
      { name: 'Ferrosos (hierro, acero, fundición/hierro colado, acero inoxidable)', description: 'Chatarra ferrosa pesada y liviana' },
      { name: 'No ferrosos - Cobre', description: 'Cobre de primera, estañado y tubería' },
      { name: 'No ferrosos - Aluminio (perfil, lámina, viruta, latas)', description: 'Aluminio industrial y latas UBC' },
      { name: 'No ferrosos - Bronce / Latón', description: 'Piezas mecánicas y valvulería' },
      { name: 'No ferrosos - Plomo (incluye baterías)', description: 'Plomo industrial y baterías automotrices' },
      { name: 'Chatarra electrónica (cables, motores)', description: 'Cableado eléctrico y bobinados' },
    ],
  },
  {
    name: 'Madera',
    description: 'Subproductos y elementos maderables recuperables',
    subcategories: [
      { name: 'Estibas / pallets', description: 'Tarimas de madera estándar y euroestibas' },
      { name: 'Aglomerado / MDF', description: 'Tableros de partículas y fibras' },
      { name: 'Madera maciza', description: 'Listones, vigas y recortes limpios' },
      { name: 'Viruta / aserrín', description: 'Biomasa maderable de aserríos y carpinterías' },
    ],
  },
  {
    name: 'Textiles',
    description: 'Fibras, prendas y retazos textiles industriales o post-consumo',
    subcategories: [
      { name: 'Ropa reutilizable', description: 'Prendas en buen estado para segundo uso' },
      { name: 'Ropa no reutilizable (fibra)', description: 'Prendas en desuso para desfibrado' },
      { name: 'Retazos de confección', description: 'Sobrantes de corte industrial de tela' },
      { name: 'Calzado', description: 'Zapatos y partes de calzado recuperables' },
    ],
  },
  {
    name: 'Orgánicos',
    description: 'Residuos biodegradables y aceites para valorización energética o compostaje',
    subcategories: [
      { name: 'Residuos de cocina / restaurante', description: 'Materia orgánica no cocinada y sobrantes alimentarios' },
      { name: 'Aceite de Cocina Usado (ACU/AVU)', description: 'Aceite vegetal usado filtrado para biodiésel' },
      { name: 'Poda y jardinería', description: 'Ramas, hojas y corteza vegetal' },
    ],
  },
  {
    name: 'RAEE / Electrónicos',
    description: 'Residuos de aparatos eléctricos y electrónicos',
    subcategories: [
      { name: 'Línea blanca', description: 'Neveras, lavadoras y estufas en desuso' },
      { name: 'Línea café / tecnología', description: 'Televisores, monitores y computadores' },
      { name: 'Pilas y acumuladores', description: 'Pilas secas alcalinas y botón' },
      { name: 'Baterías plomo-ácido', description: 'Baterías automotrices e industriales' },
      { name: 'Bombillas', description: 'Luminarias fluorescentes y LED' },
    ],
  },
  {
    name: 'Escombros / RCD',
    description: 'Residuos de construcción y demolición aprovechables',
    subcategories: [
      { name: 'Pétreos (concreto, ladrillo, arena)', description: 'Materiales granulares de demolición' },
      { name: 'No pétreos aprovechables (madera de obra, metal de obra, yeso)', description: 'Drywall, formaleta y perfilería' },
    ],
  },
  {
    name: 'Papel y cartón',
    description: 'Fibras celulósicas recuperables secas y limpias',
    subcategories: [
      { name: 'Cartón corrugado', description: 'Cajas de embalaje corrugado' },
      { name: 'Archivo / papel blanco', description: 'Hojas bond y papel de oficina impreso' },
      { name: 'Periódico', description: 'Papel prensa' },
      { name: 'Plegadiza', description: 'Cartoncillo y empaques secundarios' },
      { name: 'Tetrapak', description: 'Envases multicapa de cartón, polietileno y aluminio' },
    ],
  },
  {
    name: 'Vidrio',
    description: 'Vidrio hueco y plano para fundición y reciclaje',
    subcategories: [
      { name: 'Transparente', description: 'Botellas y frascos de vidrio incoloro' },
      { name: 'De color', description: 'Botellas de vidrio ámbar, verde y azul' },
      { name: 'Plano', description: 'Vidrio de ventanas y cancelería sin lámina plástica' },
    ],
  },
];

/**
 * Sembrador idempotente del catálogo de unidades y categorías de material.
 */
export async function seedCatalogAndUnits(): Promise<void> {
  // 1. Sembrar unidades de medida
  for (const u of INITIAL_UNITS) {
    await prisma.unit.upsert({
      where: { name: u.name },
      update: { abbreviation: u.abbreviation, active: true },
      create: { name: u.name, abbreviation: u.abbreviation, active: true },
    });
  }

  // 2. Sembrar categorías y subcategorías
  for (const cat of INITIAL_CATEGORIES) {
    let parent = await prisma.materialCategory.findFirst({
      where: { parentId: null, name: cat.name },
    });

    if (!parent) {
      parent = await prisma.materialCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          parentId: null,
          active: true,
        },
      });
    } else {
      parent = await prisma.materialCategory.update({
        where: { id: parent.id },
        data: { description: cat.description, active: true },
      });
    }

    for (const sub of cat.subcategories) {
      const existingSub = await prisma.materialCategory.findFirst({
        where: { parentId: parent.id, name: sub.name },
      });

      if (!existingSub) {
        await prisma.materialCategory.create({
          data: {
            name: sub.name,
            description: sub.description,
            parentId: parent.id,
            active: true,
          },
        });
      } else {
        await prisma.materialCategory.update({
          where: { id: existingSub.id },
          data: { description: sub.description, active: true },
        });
      }
    }
  }
}
