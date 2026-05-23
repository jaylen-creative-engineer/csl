import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ sponsorId?: string }> };

export default async function SponsorRedirectPage({ searchParams }: Props) {
  const { sponsorId } = await searchParams;
  if (sponsorId) {
    redirect(`/sponsor/${sponsorId}`);
  }
  redirect("/sponsor");
}
