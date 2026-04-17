import type { ISponsorAttachmentRepository, ISponsorRepository } from "../repository.types.js";
import type {
  Sponsor,
  SponsorAttachment,
  SponsorAttachmentId,
  SponsorId,
} from "../../sponsor-intelligence/types.js";
import { InMemoryRepository } from "./base.repository.js";

export class InMemorySponsorRepository
  extends InMemoryRepository<Sponsor, SponsorId>
  implements ISponsorRepository
{
  constructor() {
    super("sponsor");
  }
}

export class InMemorySponsorAttachmentRepository
  extends InMemoryRepository<SponsorAttachment, SponsorAttachmentId>
  implements ISponsorAttachmentRepository
{
  constructor() {
    super("attachment");
  }

  findBySponsorId(sponsorId: SponsorId): SponsorAttachment[] {
    return this.findAll().filter((a) => a.sponsorId === sponsorId);
  }
}
