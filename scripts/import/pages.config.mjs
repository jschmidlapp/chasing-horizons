// Hand-written mapping from the Google Sites export to the new content model.
// Used only by scripts/import/google-sites.mjs (a one-time migration). See docs/migration.md.

/** Regions, in display order. `cover` = { page, index } picks the Nth content image on a hub page. */
export const regions = [
  { slug: 'rocky-mountain-np', title: 'Rocky Mountain National Park', page: 'Rocky Mountain NP.html', cover: { page: 'Places.html', index: 0 } },
  { slug: 'sequoia-np', title: 'Sequoia National Park', page: 'Sequoia NP.html', cover: { page: 'Places.html', index: 1 } },
  { slug: 'henry-coe-sp', title: 'Henry Coe State Park', page: 'Henry Coe SP.html', cover: { page: 'Places.html', index: 2 } },
  { slug: 'north-bay', title: 'North Bay', page: 'North Bay.html', cover: { page: 'Places.html', index: 3 } },
  { slug: 'south-bay', title: 'South Bay', page: 'South Bay.html', cover: { page: 'Places.html', index: 4 } },
  { slug: 'los-gatos', title: 'Los Gatos', parent: 'south-bay', page: 'Los Gatos.html', cover: { page: 'South Bay.html', index: 0 } },
  { slug: 'san-jose', title: 'San Jose', parent: 'south-bay', page: 'San Jose.html', cover: { page: 'South Bay.html', index: 1 } },
  { slug: 'saratoga', title: 'Saratoga', parent: 'south-bay', page: 'Saratoga.html', cover: { page: 'South Bay.html', index: 2 } },
  { slug: 'palo-alto', title: 'Palo Alto', parent: 'south-bay', page: 'Palo Alto.html', cover: { page: 'South Bay.html', index: 3 } },
  { slug: 'monterey', title: 'Monterey', page: 'Monterey.html', cover: { page: 'Places.html', index: 5 } },
  { slug: 'colorado', title: 'Colorado', page: 'Colorado.html', cover: { page: 'Places.html', index: 6 } },
  { slug: 'arizona', title: 'Arizona', page: 'Arizona.html', cover: { page: 'Places.html', index: 7 } },
  { slug: 'utah', title: 'Utah', page: 'Utah.html', cover: { page: 'Places.html', index: 8 } },
  { slug: 'santa-cruz', title: 'Santa Cruz', page: 'Santa Cruz.html', cover: { page: 'Places.html', index: 9 } },
  { slug: 'ohio', title: 'Ohio', page: 'Ohio.html', cover: { page: 'Places.html', index: 10 } },
];

/**
 * Pages that are a single trip. The page's h2 is the title; h3s become sections.
 * `cover` = the hub-page card image used on the old site.
 */
export const singleTripPages = [
  { page: 'Hike to Sky Pond.html', region: 'rocky-mountain-np', activities: ['hike'], cover: { page: 'Rocky Mountain NP.html', index: 0 } },
  { page: 'Flattop Mountain Hike.html', region: 'rocky-mountain-np', activities: ['hike'], cover: { page: 'Rocky Mountain NP.html', index: 1 } },
  { page: 'Five Lakes Hike.html', region: 'rocky-mountain-np', activities: ['hike'], cover: { page: 'Rocky Mountain NP.html', index: 2 } },
  { page: 'Sequoias and Moro Rock.html', region: 'sequoia-np', activities: ['hike'], cover: { page: 'Sequoia NP.html', index: 0 } },
  { page: 'Lake Trails Hike.html', region: 'sequoia-np', activities: ['hike'], cover: { page: 'Sequoia NP.html', index: 1 } },
  { page: 'Marble Falls Hike.html', region: 'sequoia-np', activities: ['hike'], cover: { page: 'Sequoia NP.html', index: 2 } },
];

/**
 * Pages that hold several trips. Each heading at `split` level starts a new trip; headings above it
 * (but below h1) become the trip's `area`. Content before the first split heading becomes the
 * region's intro text. `headingParagraphs` are <p> texts that were used as headings on the old site.
 * `activities` maps trip title -> activities, falling back to `defaultActivities`.
 */
export const multiTripPages = [
  { page: 'Arizona.html', region: 'arizona', split: 2, activities: { 'Grand Canyon': ['hike'] }, defaultActivities: ['mtb'] },
  { page: 'Colorado.html', region: 'colorado', split: 3, defaultActivities: ['mtb'] },
  {
    page: 'Henry Coe SP.html', region: 'henry-coe-sp', split: 2, defaultActivities: ['mtb'],
    activities: Object.fromEntries(
      ['Corral Trail', 'Springs Trail', 'Madrone Soda Springs Trail', 'Mile Trail', 'China Hole', 'Creekside Trail', 'Middle Ridge Trail']
        .map((t) => [t, ['hike']]),
    ),
  },
  { page: 'Los Gatos.html', region: 'los-gatos', split: 2, defaultActivities: ['mtb'] },
  { page: 'Monterey.html', region: 'monterey', split: 2, activities: { 'Big Sur': ['scenic'], '12 Mile Drive': ['scenic'] }, defaultActivities: ['mtb'] },
  { page: 'North Bay.html', region: 'north-bay', split: 2, headingParagraphs: ['Mt Tam', 'Pt Reyes National Seashore'], defaultActivities: ['hike'] },
  { page: 'Ohio.html', region: 'ohio', split: 3, defaultActivities: ['hike'] },
  { page: 'Palo Alto.html', region: 'palo-alto', split: 2, defaultActivities: ['mtb'] },
  { page: 'San Jose.html', region: 'san-jose', split: 2, defaultActivities: ['mtb'] },
  { page: 'Santa Cruz.html', region: 'santa-cruz', split: 2, headingParagraphs: ['Cotoni-Coast Dairies'], defaultActivities: ['mtb'] },
  { page: 'Saratoga.html', region: 'saratoga', split: 2, defaultActivities: ['mtb'] },
  { page: 'Utah.html', region: 'utah', split: 3, activities: { 'Arches National Park': ['hike'] }, defaultActivities: ['mtb'] },
];

/** Gear page: each h1 after the first is an item; its image precedes the heading. */
export const gearPage = 'Gear.html';

/** Home page: card images used as section art. */
export const homePage = 'Home.html';
