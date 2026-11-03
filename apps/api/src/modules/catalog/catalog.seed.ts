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
    description: 'Plásticos aprovechables clasificados por tipo de resina y presentación',
    subcategories: [
      { name: 'PET (1)', description: 'Botellas de bebidas' },
      { name: 'PEAD / HDPE (2)', description: 'Envases rígidos y canecas' },
      { name: 'PVC (3)', description: 'Tubería y película' },
      { name: 'PEBD / LDPE (4)', description: 'Bolsas, película y plástico de burbuja' },
      { name: 'PP (5)', description: 'Tapas y empaques rígidos' },
      { name: 'PS (6)', description: 'Icopor y desechables' },
      { name: 'Otros y mezclados (7)', description: 'Plásticos multicapa' },
      {
        name: 'Plásticos de ingeniería (ABS, policarbonato, nailon)',
        description: 'Plásticos de ingeniería. Propuesta.',
      },
      { name: 'Estibas plásticas', description: 'Estibas y pallets de plástico' },
    ],
  },
  {
    name: 'Metales',
    description: 'Metales ferrosos, no ferrosos y chatarra metálica',
    subcategories: [
      { name: 'Hierro gris', description: 'Fundición o hierro colado' },
      { name: 'Acero', description: 'Chatarra de acero' },
      { name: 'Acero inoxidable', description: 'Chatarra de acero inoxidable' },
      { name: 'Estructuras metálicas', description: 'Estructuras y perfiles metálicos' },
      { name: 'Chatarra de maquinaria y equipos', description: 'Maquinaria y equipos fuera de uso' },
      { name: 'Cobre', description: 'Cobre recuperable' },
      { name: 'Bronce', description: 'Bronce recuperable' },
      { name: 'Latón', description: 'Latón recuperable' },
      { name: 'Aluminio: perfil', description: 'Perfiles de aluminio' },
      { name: 'Aluminio: lámina gruesa', description: 'Lámina gruesa de aluminio' },
      { name: 'Aluminio: viruta', description: 'Viruta de aluminio' },
      { name: 'Aluminio: latas', description: 'Latas de aluminio' },
      { name: 'Aluminio: radiadores', description: 'Radiadores de aluminio' },
      { name: 'Aluminio: rines', description: 'Rines de aluminio' },
      { name: 'Plomo', description: 'Plomo recuperable' },
      { name: 'Zinc', description: 'Zinc recuperable' },
      { name: 'Estaño', description: 'Estaño recuperable' },
      { name: 'Níquel', description: 'Níquel recuperable' },
      { name: 'Cables y alambre', description: 'Cables y alambre de cobre o aluminio' },
      { name: 'Motores eléctricos', description: 'Motores eléctricos fuera de uso' },
      { name: 'Chatarra electrónica: tarjetas y componentes', description: 'Tarjetas y componentes electrónicos' },
    ],
  },
  {
    name: 'Madera',
    description: 'Madera, subproductos y residuos vegetales aprovechables',
    subcategories: [
      { name: 'Estibas y pallets de madera', description: 'Estibas y pallets de madera' },
      { name: 'Aglomerado y MDF', description: 'Tableros de aglomerado y MDF' },
      {
        name: 'Madera maciza',
        description: 'Listones, tablones y formaleta de obra',
      },
      { name: 'Viruta, aserrín y recortes', description: 'Subproductos de madera' },
      {
        name: 'Troncos y ramas de poda',
        description: 'Uso como madera o leña',
      },
    ],
  },
  {
    name: 'Muebles y enseres para reutilizar',
    description: 'Muebles y enseres recuperables para reutilización',
    subcategories: [
      { name: 'Muebles de madera', description: 'Muebles de madera reutilizables' },
      { name: 'Muebles de oficina', description: 'Muebles de oficina reutilizables' },
      { name: 'Muebles metálicos', description: 'Muebles metálicos reutilizables' },
      { name: 'Otros enseres del hogar reutilizables', description: 'Enseres del hogar en condición de reutilización' },
    ],
  },
  {
    name: 'Textiles y calzado',
    description: 'Prendas, fibras, retazos textiles y calzado',
    subcategories: [
      { name: 'Ropa reutilizable', description: 'Ropa para segundo uso' },
      { name: 'Ropa no reutilizable (reciclaje de fibra)', description: 'Prendas para reciclaje de fibra' },
      { name: 'Retazos de confección y sobrantes de maquila', description: 'Retazos y sobrantes del proceso de confección' },
      { name: 'Calzado', description: 'Calzado reutilizable o aprovechable' },
    ],
  },
  {
    name: 'Orgánicos',
    description: 'Residuos orgánicos y aceites para aprovechamiento',
    subcategories: [
      { name: 'Residuos de cocina y restaurante', description: 'Residuos orgánicos de cocina y restaurantes' },
      { name: 'Aceite de cocina usado (ACU o AVU)', description: 'Aceite vegetal de cocina usado' },
      { name: 'Poda y jardinería', description: 'Residuos vegetales para compostaje' },
      { name: 'Residuos de plaza de mercado', description: 'Residuos orgánicos de plazas de mercado' },
      {
        name: 'Residuos agroindustriales',
        description: 'Cascarilla, bagazo y cáscaras. Propuesta.',
      },
    ],
  },
  {
    name: 'Electrónicos y posconsumo',
    description: 'Residuos de aparatos eléctricos, electrónicos y posconsumo',
    subcategories: [
      { name: 'Línea blanca', description: 'Neveras, lavadoras y estufas' },
      { name: 'Computadores y periféricos', description: 'Computadores y sus periféricos' },
      { name: 'Celulares y tabletas', description: 'Teléfonos celulares y tabletas' },
      { name: 'Televisores y pantallas', description: 'Televisores y pantallas electrónicas' },
      { name: 'Pilas y acumuladores', description: 'Pilas y acumuladores usados' },
      { name: 'Baterías plomo-ácido', description: 'Baterías de carro y moto' },
      { name: 'Bombillas', description: 'Bombillas LED, fluorescentes y halógenas' },
      { name: 'Llantas usadas', description: 'Llantas usadas para gestión posconsumo' },
      { name: 'Otros aparatos eléctricos y electrónicos', description: 'Otros aparatos eléctricos y electrónicos' },
    ],
  },
  {
    name: 'Escombros y residuos de construcción',
    description: 'Residuos de construcción aprovechables',
    subcategories: [
      { name: 'Concreto y mortero', description: 'Residuos de concreto y mortero' },
      { name: 'Ladrillo y cerámica', description: 'Ladrillo y productos cerámicos' },
      { name: 'Arena, grava y piedra', description: 'Materiales pétreos de construcción' },
      { name: 'Yeso y drywall', description: 'Residuos de yeso y drywall' },
      { name: 'Tierras de excavación', description: 'Tierras y suelos de excavación' },
      {
        name: 'Otros residuos de construcción no pétreos aprovechables',
        description: 'Residuos de construcción no pétreos aprovechables',
      },
    ],
  },
  {
    name: 'Papel y cartón',
    description: 'Fibras celulósicas recuperables',
    subcategories: [
      { name: 'Cartón corrugado', description: 'Cartón corrugado de embalaje' },
      { name: 'Archivo y papel blanco', description: 'Papel de archivo y papel blanco' },
      { name: 'Periódico y papel impreso', description: 'Periódicos y papel impreso' },
      { name: 'Plegadiza', description: 'Cajas y empaques de plegadiza' },
      { name: 'Tetrapak', description: 'Envases multicapa' },
      { name: 'Papel mixto', description: 'Papel mixto. Propuesta.' },
    ],
  },
  {
    name: 'Vidrio',
    description: 'Vidrio de envases y vidrio plano',
    subcategories: [
      { name: 'Vidrio transparente', description: 'Vidrio transparente' },
      { name: 'Vidrio de color', description: 'Vidrio ámbar y verde' },
      { name: 'Vidrio plano', description: 'Vidrio plano de construcción' },
    ],
  },
  {
    name: 'Residuos peligrosos',
    description: 'Residuos peligrosos sujetos a manejo especializado',
    subcategories: [
      { name: 'Aceites usados (automotrices e industriales)', description: 'Aceites usados automotrices e industriales' },
      { name: 'Envases contaminados con químicos', description: 'Envases con residuos de sustancias químicas' },
      { name: 'Envases de plaguicidas', description: 'Envases usados de plaguicidas' },
      {
        name: 'Residuos hospitalarios',
        description: 'Inactiva hasta decisión jurídica.',
        active: false,
      },
      {
        name: 'Equipos con PCB',
        description: 'Transformadores antiguos. Inactiva hasta decisión jurídica.',
        active: false,
      },
    ],
  },
];

const LEGACY_ROOT_NAMES: Record<string, string> = {
  'Textiles y calzado': 'Textiles',
  'Electrónicos y posconsumo': 'RAEE / Electrónicos',
  'Escombros y residuos de construcción': 'Escombros / RCD',
};

const LEGACY_SUBCATEGORIES: Record<string, string[]> = {
  Plásticos: [
    'PET (botellas transparentes, de color, contaminadas con aceite)',
    'PEAD / HDPE (rígido limpio, rígido sucio)',
    'PVC',
    'PEBD / LDPE (film, bolsas)',
    'PP (Polipropileno)',
    'PS (Poliestireno / icopor)',
    'Mezclados / no identificados',
  ],
  Metales: [
    'Ferrosos (hierro, acero, fundición/hierro colado, acero inoxidable)',
    'No ferrosos - Cobre',
    'No ferrosos - Aluminio (perfil, lámina, viruta, latas)',
    'No ferrosos - Bronce / Latón',
    'No ferrosos - Plomo (incluye baterías)',
    'Chatarra electrónica (cables, motores)',
  ],
  Madera: ['Estibas / pallets', 'Aglomerado / MDF', 'Madera maciza', 'Viruta / aserrín'],
  'Textiles y calzado': [
    'Ropa reutilizable',
    'Ropa no reutilizable (fibra)',
    'Retazos de confección',
    'Calzado',
  ],
  Orgánicos: [
    'Residuos de cocina / restaurante',
    'Aceite de Cocina Usado (ACU/AVU)',
    'Poda y jardinería',
  ],
  'Electrónicos y posconsumo': [
    'Línea blanca',
    'Línea café / tecnología',
    'Pilas y acumuladores',
    'Baterías plomo-ácido',
    'Bombillas',
  ],
  'Escombros y residuos de construcción': [
    'Pétreos (concreto, ladrillo, arena)',
    'No pétreos aprovechables (madera de obra, metal de obra, yeso)',
  ],
  'Papel y cartón': [
    'Cartón corrugado',
    'Archivo / papel blanco',
    'Periódico',
    'Plegadiza',
    'Tetrapak',
  ],
  Vidrio: ['Transparente', 'De color', 'Plano'],
};

export async function catalogNeedsSeeding(): Promise<boolean> {
  const roots = await prisma.materialCategory.findMany({
    where: { parentId: null },
    include: { subcategories: { select: { name: true, active: true } } },
  });

  const legacyRootRemainsActive = Object.entries(LEGACY_ROOT_NAMES).some(
    ([currentName, legacyName]) =>
      roots.some(({ name, active }) => name === currentName && active)
      && roots.some(({ name, active }) => name === legacyName && active)
  );
  if (legacyRootRemainsActive) {
    return true;
  }

  return INITIAL_CATEGORIES.some((category) => {
    const root = roots.find(({ name }) => name === category.name)
      ?? roots.find(({ name }) => name === LEGACY_ROOT_NAMES[category.name]);
    if (!root) {
      return true;
    }

    const desiredNames = new Set(category.subcategories.map(({ name }) => name));
    return category.subcategories.some(
      (subcategory) => !root.subcategories.some(({ name }) => name === subcategory.name)
    ) || (LEGACY_SUBCATEGORIES[category.name] ?? []).some(
      (name) => !desiredNames.has(name)
        && root.subcategories.some((subcategory) => subcategory.name === name && subcategory.active)
    );
  });
}

/**
 * Sembrador idempotente del catálogo de materiales y unidades.
 */
export async function seedCatalogAndUnits(): Promise<void> {
  for (const unit of INITIAL_UNITS) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: { abbreviation: unit.abbreviation, active: true },
      create: { name: unit.name, abbreviation: unit.abbreviation, active: true },
    });
  }

  for (const category of INITIAL_CATEGORIES) {
    let parent = await prisma.materialCategory.findFirst({
      where: { parentId: null, name: category.name },
    });

    if (!parent && LEGACY_ROOT_NAMES[category.name]) {
      parent = await prisma.materialCategory.findFirst({
        where: { parentId: null, name: LEGACY_ROOT_NAMES[category.name] },
      });
    }

    if (!parent) {
      parent = await prisma.materialCategory.create({
        data: {
          name: category.name,
          description: category.description,
          parentId: null,
          active: true,
        },
      });
    } else {
      parent = await prisma.materialCategory.update({
        where: { id: parent.id },
        data: {
          name: category.name,
          description: category.description,
          active: true,
        },
      });
    }

    const desiredNames = new Set(category.subcategories.map(({ name }) => name));
    const obsoleteLegacyNames = (LEGACY_SUBCATEGORIES[category.name] ?? []).filter(
      (name) => !desiredNames.has(name)
    );
    if (obsoleteLegacyNames.length > 0) {
      await prisma.materialCategory.updateMany({
        where: {
          parentId: parent.id,
          name: { in: obsoleteLegacyNames },
        },
        data: { active: false },
      });
    }

    for (const subcategory of category.subcategories) {
      const active = subcategory.active ?? true;
      const existing = await prisma.materialCategory.findFirst({
        where: { parentId: parent.id, name: subcategory.name },
      });

      if (!existing) {
        await prisma.materialCategory.create({
          data: {
            name: subcategory.name,
            description: subcategory.description,
            parentId: parent.id,
            active,
          },
        });
      } else {
        await prisma.materialCategory.update({
          where: { id: existing.id },
          data: { description: subcategory.description, active },
        });
      }
    }
  }

  for (const [newName, legacyName] of Object.entries(LEGACY_ROOT_NAMES)) {
    const legacy = await prisma.materialCategory.findFirst({
      where: { parentId: null, name: legacyName },
    });
    const current = await prisma.materialCategory.findFirst({
      where: { parentId: null, name: newName },
    });
    if (legacy && current && legacy.id !== current.id) {
      await prisma.materialCategory.updateMany({
        where: { id: legacy.id },
        data: { active: false },
      });
      await prisma.materialCategory.updateMany({
        where: { parentId: legacy.id },
        data: { active: false },
      });
    }
  }
}
