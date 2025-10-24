'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function WorkItemDetailsPage() {
  const params = useParams();
  const firestore = useFirestore();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const idParts = params.id as string[];
        console.log('🧭 idParts:', idParts);

        if (!idParts || idParts.length < 4) {
          throw new Error('Invalid path');
        }

        const projectId = idParts[1];
        const taskId = idParts[3];

        const ref = doc(firestore, 'projects', projectId, 'tasks', taskId);
        console.log('📄 Fetching from path:', ref.path);

        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          console.log('✅ Document data:', snapshot.data());
          setData(snapshot.data());
        } else {
          console.log('❌ Document not found');
          setError('Not found');
        }
      } catch (err: any) {
        console.error('🔥 Error fetching document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firestore, params.id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Details</h1>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
