import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ challengeId?: string }> };

export default async function JudgeRedirectPage({ searchParams }: Props) {
  const { challengeId } = await searchParams;
  if (challengeId) {
    redirect(`/judge/${challengeId}`);
  }
  redirect("/judge");
}
