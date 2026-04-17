import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { sponsors, sponsorAttachments } from "../schema.js";
import type {
  ISponsorAttachmentRepository,
  ISponsorRepository,
} from "../../persistence/repository.types.js";
import type {
  Sponsor,
  SponsorAttachment,
  SponsorAttachmentId,
  SponsorId,
} from "../../sponsor-intelligence/types.js";
import { SponsorOutcomeStatus } from "../../sponsor-intelligence/types.js";

export class DrizzleSponsorRepository implements ISponsorRepository {
  constructor(private readonly db: Db) {}

  nextId(): SponsorId {
    return `sponsor:${crypto.randomUUID()}`;
  }

  async save(entity: Sponsor): Promise<void> {
    await this.db
      .insert(sponsors)
      .values({
        id: entity.id,
        name: entity.name,
        organization: entity.organization,
        contactEmail: entity.contactEmail,
        createdAt: entity.createdAt,
      })
      .onConflictDoUpdate({
        target: sponsors.id,
        set: { name: entity.name, organization: entity.organization, contactEmail: entity.contactEmail },
      });
  }

  async findById(id: SponsorId): Promise<Sponsor | undefined> {
    return this.db.query.sponsors.findFirst({ where: eq(sponsors.id, id) });
  }

  async findAll(): Promise<Sponsor[]> {
    return this.db.query.sponsors.findMany();
  }
}

export class DrizzleSponsorAttachmentRepository implements ISponsorAttachmentRepository {
  constructor(private readonly db: Db) {}

  nextId(): SponsorAttachmentId {
    return `attachment:${crypto.randomUUID()}`;
  }

  async save(entity: SponsorAttachment): Promise<void> {
    await this.db
      .insert(sponsorAttachments)
      .values({
        id: entity.id,
        sponsorId: entity.sponsorId,
        challengeId: entity.challengeId,
        brief: entity.brief,
        attachedAt: entity.attachedAt,
        outcome: entity.outcome ?? null,
      })
      .onConflictDoUpdate({
        target: sponsorAttachments.id,
        set: { brief: entity.brief, outcome: entity.outcome ?? null },
      });
  }

  async findById(id: SponsorAttachmentId): Promise<SponsorAttachment | undefined> {
    const row = await this.db.query.sponsorAttachments.findFirst({
      where: eq(sponsorAttachments.id, id),
    });
    if (!row) return undefined;
    return rowToAttachment(row);
  }

  async findAll(): Promise<SponsorAttachment[]> {
    const rows = await this.db.query.sponsorAttachments.findMany();
    return rows.map(rowToAttachment);
  }

  async findBySponsorId(sponsorId: SponsorId): Promise<SponsorAttachment[]> {
    const rows = await this.db
      .select()
      .from(sponsorAttachments)
      .where(eq(sponsorAttachments.sponsorId, sponsorId));
    return rows.map(rowToAttachment);
  }
}

function rowToAttachment(row: typeof sponsorAttachments.$inferSelect): SponsorAttachment {
  return {
    id: row.id,
    sponsorId: row.sponsorId,
    challengeId: row.challengeId,
    brief: row.brief as any,
    attachedAt: row.attachedAt,
    outcome: row.outcome ? { ...(row.outcome as any), status: (row.outcome as any).status as SponsorOutcomeStatus } : undefined,
  };
}
