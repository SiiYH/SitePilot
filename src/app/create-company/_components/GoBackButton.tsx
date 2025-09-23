
'use client';

import { useRouter } from 'next/navigation';

export default function GoBackButton() {
  const router = useRouter();

  return (
    <button onClick={() => router.back()} className="font-medium text-primary hover:underline">
      return to the previous page
    </button>
  );
}
