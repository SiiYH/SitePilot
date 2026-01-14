import { notFound } from 'next/navigation';
import { adminDb } from '@/firebase/admin';
import MaterialPurchaseClient from './MaterialPurchaseClient';
import type { MaterialPurchase } from '@/types';

export default async function Page({ params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  const snap = await adminDb
    .collection('materialPurchases')
    .doc(id)
    .get();

  if (!snap.exists) notFound();

  const purchase = {
    id: snap.id,
    ...snap.data()
  } as MaterialPurchase;

  return <MaterialPurchaseClient purchase={purchase} />;
}