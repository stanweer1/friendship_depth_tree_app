import { ShareView } from "@/components/share/ShareView";
import { readShare } from "@/lib/share-store";
import { notFound } from "next/navigation";

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { code } = await params;
  const query = await searchParams;
  const snapshot = await readShare(code);
  if (!snapshot) notFound();
  return <ShareView snapshot={snapshot} focusId={query.branch} />;
}
