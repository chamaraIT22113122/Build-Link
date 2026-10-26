import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { KnowledgeArticle } from '../database/entities';
import {
  KnowledgeArticleDto,
  CreateKnowledgeArticleDto,
  KnowledgeSearchQueryDto,
} from '@buildlink/shared';

// In-memory resilient store for offline / test environments
const memoryArticles = new Map<string, KnowledgeArticle>();

const SEED_ARTICLES: Array<Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    slug: 'sls-1253-concrete-mix-proportions',
    title: 'SLS 1253 & SLS 522: Standard Concrete Mix Proportions & Quality for Residential Buildings',
    category: 'Concrete Technology',
    summary: 'Comprehensive guide to ready-mix and site-mixed concrete grades (Grade 20, 25, 30) adhering to Sri Lanka Standards Institution (SLSI) specifications.',
    content: `## 1. Concrete Mix Classifications in Sri Lanka

Under SLS 1253 (Specification for Ready-Mixed Concrete) and SLS 522 (Portland Cement), domestic and multi-story structural elements require strict characteristic compressive strengths:

- **Grade 15 (1:3:6 nominal mix)**: Suitable for lean concrete blinding under foundations and mass concrete work. Minimum 28-day characteristic cube strength: 15 N/mm².
- **Grade 20 (1:2:4 nominal mix)**: Common standard for single-story ground beams, lintols, and floor screeds. Characteristic strength: 20 N/mm².
- **Grade 25 & 30 (Design mix)**: Required for all two-story and multi-story reinforced columns, cantilever slabs, and load-bearing retaining walls. Minimum cement content: 360 kg/m³.

## 2. Water-Cement Ratio and Workability

The water-cement ratio must never exceed 0.50 by mass for exposed coastal elements and 0.55 for sheltered inland structures. Excessive water decreases the compressive strength exponentially and introduces capillary shrinkage cracks.

### Slump Test Compliance
- Columns & Walls: 75mm - 100mm
- Slabs & Beams: 50mm - 75mm
- Piles & Deep Foundations: 125mm - 150mm

## 3. Curing Requirements
Under tropical Sri Lankan ambient temperatures (28°C - 34°C), hydration occurs rapidly. Wet burlap, polythene ponding, or membrane curing must be maintained for a mandatory minimum of 7 consecutive days (14 days for blended pozzolanic cements).`,
    coverImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80',
    authorName: 'Eng. Kithsiri Perera, FIESL',
    standardsReference: 'SLS 1253:2015 / SLS 522',
    tagsJson: JSON.stringify(['Concrete', 'SLS 1253', 'Grade 25', 'Structural Mix', 'Curing']),
    readingTimeMinutes: 6,
    viewsCount: 1420,
    isPublished: true,
  },
  {
    slug: 'cida-sp201-reinforcement-clear-cover',
    title: 'CIDA SP/201: Minimum Clear Cover and Rebar Detailing for Sri Lankan Structures',
    category: 'Structural Design',
    summary: 'Construction Industry Development Authority (CIDA) guidelines on preventing steel reinforcement corrosion through proper concrete cover spacers.',
    content: `## 1. Statutory Clear Cover Mandates (CIDA SP/201)

Reinforced concrete durability depends directly on preserving the passive alkalinity (pH > 12.5) surrounding the carbon steel rebar. According to CIDA Specifications for Building Works (SP/201):

| Structural Element | Mild Inland Exposure | Severe Coastal Exposure (< 5km from sea) |
|---|---|---|
| Foundation Footing (Cast against blinding) | 50 mm | 75 mm |
| Ground Beams | 40 mm | 50 mm |
| Columns & Lintel Beams | 30 mm | 40 mm |
| Suspended Slabs & Stairs | 20 mm | 30 mm |
| Retaining Walls (Earth-retaining face) | 50 mm | 60 mm |

## 2. Spacer Blocks and Fastening

- Mortar cover blocks must have equal or higher strength than the surrounding structural concrete (Grade 25+).
- Wooden blocks, broken bricks, or aggregate stones are strictly forbidden as cover spacers.
- Secure spacers with galvanized binding wire at a frequency of not less than 4 spacers per square meter.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    authorName: 'Eng. Dilani Jayatilleke, CEng MIESL',
    standardsReference: 'CIDA SP/201',
    tagsJson: JSON.stringify(['CIDA', 'SP/201', 'Rebar', 'Clear Cover', 'Corrosion Protection']),
    readingTimeMinutes: 5,
    viewsCount: 980,
    isPublished: true,
  },
  {
    slug: 'nbro-guidelines-slope-stability-retaining-walls',
    title: 'NBRO Guidelines: Construction and Retaining Wall Standards in Hill Country',
    category: 'Foundation & Soil',
    summary: 'National Building Research Organisation (NBRO) requirements for slope cutting, weep holes, and gravity retaining walls in Kandy, Nuwara Eliya, and Badulla.',
    content: `## 1. Landslide Hazard Clearance
Any construction on slopes exceeding 15 degrees in declared hilly districts (Kandy, Matale, Nuwara Eliya, Badulla, Ratnapura, Kegalle, Kalutara, and Galle) must obtain NBRO Landslide Clearance before municipal building permits can be issued.

## 2. Slope Cut Ratios
- Soil slopes must not be cut steeper than 1:1 (45 degrees) without permanent engineered revetment.
- Weathered rock slopes must not exceed 2:1 (63 degrees).
- Vertical cuts exceeding 1.5 meters require temporary shoring and staged construction.

## 3. Retaining Wall Sub-surface Drainage
Hydrostatic water pressure is the leading cause of retaining wall failure in hill country:
- **Weep holes**: Minimum 75mm diameter PVC pipes installed at 1.5m horizontal and vertical intervals with a 1:20 outward fall.
- **Granular filter backing**: 300mm wide graded aggregate layer wrapped in geotextile filter fabric behind the wall to prevent fine soil clogs.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?auto=format&fit=crop&w=1200&q=80',
    authorName: 'Eng. Shanaka Wickremasinghe, MIESL',
    standardsReference: 'NBRO Hazard Code 2020',
    tagsJson: JSON.stringify(['NBRO', 'Hill Country', 'Slope Stability', 'Retaining Walls', 'Drainage']),
    readingTimeMinutes: 7,
    viewsCount: 1840,
    isPublished: true,
  },
  {
    slug: 'uda-building-regulations-plot-coverage-setbacks',
    title: 'UDA Planning & Building Regulations: Setbacks, Plot Coverage and Street Lines',
    category: 'Building Regulations',
    summary: 'Urban Development Authority (UDA) Sri Lanka regulations on boundary setbacks, daylight angles, minimum room dimensions, and maximum plot coverage.',
    content: `## 1. Boundary Setbacks
Under UDA Planning & Building Regulations (Gazette Extraordinary):

- **Rear Space**: A minimum continuous open rear space of 3.0 meters (10 feet) is required across the full width of the plot for residential buildings.
- **Side Setbacks**: Minimum 1.0 meter (3.3 feet) setback from side boundaries for walls with window openings, ventilation louvres, or balconies.
- **Blind Walls**: If approved by the local authority, a blind wall (with zero door or window openings) may be constructed up to the side boundary, provided rainwater discharge does not overhang the neighbor's property.

## 2. Maximum Plot Coverage
- Low-density residential zones: Maximum 65% plot coverage.
- Commercial & mixed-use zones: Maximum 80% plot coverage.
- The remaining open space must allow natural surface rainwater infiltration.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    authorName: 'Archt. Rohana Senanayake, FIA (SL)',
    standardsReference: 'UDA Planning Regulations 2021',
    tagsJson: JSON.stringify(['UDA', 'Building Permits', 'Setbacks', 'Plot Coverage', 'Regulations']),
    readingTimeMinutes: 5,
    viewsCount: 2310,
    isPublished: true,
  },
];

export class KnowledgeService {
  private static parseTags(val: string | unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val as string);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [String(val)];
    }
  }

  private static toDto(a: KnowledgeArticle): KnowledgeArticleDto {
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      summary: a.summary,
      content: a.content,
      coverImageUrl: a.coverImageUrl,
      authorName: a.authorName,
      standardsReference: a.standardsReference,
      tags: KnowledgeService.parseTags(a.tagsJson),
      readingTimeMinutes: a.readingTimeMinutes || 5,
      viewsCount: a.viewsCount || 0,
      isPublished: Boolean(a.isPublished),
      createdAt: a.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: a.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  public static async initSeedArticles(): Promise<void> {
    if (AppDataSource.isInitialized) {
      const repo = AppDataSource.getRepository(KnowledgeArticle);
      const count = await repo.count();
      if (count === 0) {
        for (const seed of SEED_ARTICLES) {
          const art = repo.create({
            id: randomUUID(),
            ...seed,
          });
          await repo.save(art);
        }
      }
      return;
    }

    // In-memory seeding
    if (memoryArticles.size === 0) {
      const now = new Date();
      for (const seed of SEED_ARTICLES) {
        const id = randomUUID();
        const art = {
          id,
          ...seed,
          createdAt: now,
          updatedAt: now,
        } as unknown as KnowledgeArticle;
        memoryArticles.set(id, art);
      }
    }
  }

  public static async listArticles(
    query: KnowledgeSearchQueryDto = {}
  ): Promise<{ data: KnowledgeArticleDto[]; total: number; page: number; limit: number }> {
    await KnowledgeService.initSeedArticles();
    const { search, category, standardsReference, tag, page = 1, limit = 20 } = query;

    if (AppDataSource.isInitialized) {
      const repo = AppDataSource.getRepository(KnowledgeArticle);
      const qb = repo.createQueryBuilder('a').where('a.isPublished = :pub', { pub: true });

      if (category && category !== 'ALL') {
        qb.andWhere('a.category = :cat', { cat: category });
      }

      if (standardsReference && standardsReference !== 'ALL') {
        qb.andWhere('a.standardsReference LIKE :std', { std: `%${standardsReference}%` });
      }

      if (tag) {
        qb.andWhere('a.tagsJson LIKE :tag', { tag: `%${tag}%` });
      }

      if (search) {
        qb.andWhere('(a.title LIKE :s OR a.summary LIKE :s OR a.content LIKE :s)', {
          s: `%${search}%`,
        });
      }

      qb.orderBy('a.viewsCount', 'DESC').addOrderBy('a.createdAt', 'DESC');

      const total = await qb.getCount();
      const items = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        data: items.map((i) => KnowledgeService.toDto(i)),
        total,
        page,
        limit,
      };
    }

    // In-memory fallback
    let items = Array.from(memoryArticles.values()).filter((a) => a.isPublished);

    if (category && category !== 'ALL') {
      items = items.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    if (standardsReference && standardsReference !== 'ALL') {
      items = items.filter(
        (a) =>
          a.standardsReference &&
          a.standardsReference.toLowerCase().includes(standardsReference.toLowerCase())
      );
    }

    if (tag) {
      items = items.filter((a) => {
        const tags = KnowledgeService.parseTags(a.tagsJson);
        return tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()));
      });
    }

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          a.summary.toLowerCase().includes(s) ||
          a.content.toLowerCase().includes(s)
      );
    }

    items.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return {
      data: paginated.map((i) => KnowledgeService.toDto(i)),
      total,
      page,
      limit,
    };
  }

  public static async getArticleBySlug(slug: string): Promise<KnowledgeArticleDto | null> {
    await KnowledgeService.initSeedArticles();

    if (AppDataSource.isInitialized) {
      const repo = AppDataSource.getRepository(KnowledgeArticle);
      const art = await repo.findOne({ where: { slug, isPublished: true } });
      if (!art) return null;

      art.viewsCount = (art.viewsCount || 0) + 1;
      await repo.save(art);
      return KnowledgeService.toDto(art);
    }

    // In-memory
    for (const art of memoryArticles.values()) {
      if (art.slug === slug && art.isPublished) {
        art.viewsCount = (art.viewsCount || 0) + 1;
        return KnowledgeService.toDto(art);
      }
    }

    return null;
  }

  public static async createArticle(
    authorName: string,
    dto: CreateKnowledgeArticleDto
  ): Promise<KnowledgeArticleDto> {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const tagsJson = dto.tags ? JSON.stringify(dto.tags) : undefined;
    const readingTime = dto.readingTimeMinutes || Math.max(1, Math.round(dto.content.split(' ').length / 200));

    if (AppDataSource.isInitialized) {
      const repo = AppDataSource.getRepository(KnowledgeArticle);
      const art = repo.create({
        slug,
        title: dto.title,
        category: dto.category,
        summary: dto.summary,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        authorName: dto.authorName || authorName,
        standardsReference: dto.standardsReference,
        tagsJson,
        readingTimeMinutes: readingTime,
        viewsCount: 0,
        isPublished: true,
      });

      const saved = await repo.save(art);
      return KnowledgeService.toDto(saved);
    }

    // In-memory
    const id = randomUUID();
    const now = new Date();
    const art = {
      id,
      slug,
      title: dto.title,
      category: dto.category,
      summary: dto.summary,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
      authorName: dto.authorName || authorName,
      standardsReference: dto.standardsReference,
      tagsJson,
      readingTimeMinutes: readingTime,
      viewsCount: 0,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    } as unknown as KnowledgeArticle;

    memoryArticles.set(id, art);
    return KnowledgeService.toDto(art);
  }

  public static clearMemoryForTesting(): void {
    memoryArticles.clear();
  }
}
