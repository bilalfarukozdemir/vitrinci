import { notFound } from 'next/navigation';

import { markaStili } from '@studio/ui';

import { DEMOLAR } from '@/veriler/index';

/**
 * Her demo KENDI marka token'lariyla boyaniyor. Bloklar renk hardcode
 * etmiyor; ayni kod, farkli tema — "her site birbirinden farkli" sinirinin
 * calistigi yer burasi.
 */
export default async function DemoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const demo = DEMOLAR[slug];
  if (!demo) notFound();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: markaStili(demo.marka, demo.markaKoyu) }} />
      {children}
    </>
  );
}
