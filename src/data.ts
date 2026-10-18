export type HomeKind = 'Apartment' | 'Loft' | 'House';
export type Amenity = 'Furnished' | 'Outdoor space' | 'Pets welcome' | 'Workspace';

export interface Home {
  id: string;
  name: string;
  district: string;
  postcode: string;
  kind: HomeKind;
  image: string;
  imageAlt: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: Amenity[];
  feature: string;
  description: string;
}

// Fictional examples for an entirely local, static home-finding experience.
// Photos are illustrative and do not represent actual Vienna properties.
export const homes: Home[] = [
  {
    id: 'neubau-loft',
    name: 'The sun-drenched corner',
    district: 'Neubau',
    postcode: '1070',
    kind: 'Loft',
    image: './images/neubau-loft.webp',
    imageAlt:
      'Sunlit living room with a caramel sofa, leafy plants, and a wall of framed photographs',
    rent: 1450,
    bedrooms: 1,
    bathrooms: 1,
    area: 68,
    amenities: ['Furnished', 'Pets welcome', 'Workspace'],
    feature: 'A little extra light',
    description:
      'Slow mornings, big windows, and a sunny spot for every houseplant. This loft pairs an open living space with a quiet bedroom and a dedicated corner for working from home.',
  },
  {
    id: 'leopoldstadt-studio',
    name: 'Room for a slower Sunday',
    district: 'Leopoldstadt',
    postcode: '1020',
    kind: 'Apartment',
    image: './images/leopoldstadt-studio.webp',
    imageAlt:
      'Modern dining room with a black table, open staircase, and doors onto a timber terrace',
    rent: 1890,
    bedrooms: 2,
    bathrooms: 1,
    area: 92,
    amenities: ['Furnished', 'Outdoor space', 'Workspace'],
    feature: 'Your own outdoor space',
    description:
      'A table big enough for friends and a terrace made for your first coffee. Clean lines, natural materials, and two bedrooms make space for the everyday things you love.',
  },
  {
    id: 'josefstadt-apartment',
    name: 'A home with a softer side',
    district: 'Josefstadt',
    postcode: '1080',
    kind: 'Apartment',
    image: './images/josefstadt-apartment.webp',
    imageAlt: 'Soft neutral living room with a pale sofa, oak furniture, and light-filled windows',
    rent: 1250,
    bedrooms: 1,
    bathrooms: 1,
    area: 54,
    amenities: ['Furnished', 'Pets welcome'],
    feature: 'Small space, big character',
    description:
      'An easygoing apartment with warm wood, soft textures, and just the right amount of space. An inviting living room leads to a separate bedroom, with room to make both your own.',
  },
  {
    id: 'mariahilf-home',
    name: 'Under the wooden beams',
    district: 'Mariahilf',
    postcode: '1060',
    kind: 'Loft',
    image: './images/mariahilf-home.webp',
    imageAlt: 'Warm living room with exposed wooden beams, arched windows, and a white sofa',
    rent: 1690,
    bedrooms: 2,
    bathrooms: 1,
    area: 81,
    amenities: ['Furnished', 'Workspace'],
    feature: 'Made for cozy evenings',
    description:
      'Exposed beams and arched windows bring a little soul to this generous loft. Two bedrooms and a welcoming living room give you space to settle in and stay a while.',
  },
  {
    id: 'wieden-apartment',
    name: 'An inside-out kind of home',
    district: 'Wieden',
    postcode: '1040',
    kind: 'House',
    image: './images/wieden-apartment.webp',
    imageAlt:
      'Open-plan living room and kitchen with glass doors, a gray sofa, and warm wood walls',
    rent: 2450,
    bedrooms: 3,
    bathrooms: 2,
    area: 124,
    amenities: ['Outdoor space', 'Pets welcome', 'Workspace'],
    feature: 'Bring the outside in',
    description:
      'Wide glass doors connect a bright living space to the outdoors. With three bedrooms, two bathrooms, and an open kitchen, there is room for everyone to find their favorite corner.',
  },
  {
    id: 'alsergrund-home',
    name: 'Space for your whole world',
    district: 'Alsergrund',
    postcode: '1090',
    kind: 'House',
    image: './images/alsergrund-home.webp',
    imageAlt:
      'Airy living space with blue cushions, an open wooden staircase, and a golden retriever',
    rent: 2250,
    bedrooms: 3,
    bathrooms: 2,
    area: 112,
    amenities: ['Furnished', 'Outdoor space', 'Pets welcome'],
    feature: 'Four-legged friends welcome',
    description:
      'A generous home for full lives, lazy afternoons, and four-legged friends. A light-filled living area, three bedrooms, and a private outdoor space keep everything feeling open.',
  },
];

export const amenities: Amenity[] = ['Furnished', 'Outdoor space', 'Pets welcome', 'Workspace'];
export const currency = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export interface Filters {
  query: string;
  maxRent: string;
  minBedrooms: string;
  amenities: Amenity[];
}

export const emptyFilters: Filters = { query: '', maxRent: '', minBedrooms: '', amenities: [] };

export function filterHomes(items: Home[], filters: Filters, kind: string): Home[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return items.filter(
    (home) =>
      (!query ||
        `${home.name} ${home.district} ${home.postcode} ${home.kind} Vienna Wien`
          .toLocaleLowerCase()
          .includes(query)) &&
      (!filters.maxRent || home.rent <= Number(filters.maxRent)) &&
      (!filters.minBedrooms || home.bedrooms >= Number(filters.minBedrooms)) &&
      filters.amenities.every((amenity) => home.amenities.includes(amenity)) &&
      (kind === 'All homes' || home.kind === kind),
  );
}
