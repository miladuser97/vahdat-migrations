"use client";

import { useEffect, useState } from "react";

type Candidate = {
  id: string;
  sourceUrl: string;
  previewUrl: string;
  status: string;
  createdAt: string;
};

export function CandidateList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const res = await fetch("/api/admin/media/candidates");
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;
  if (candidates.length === 0) return <p className="text-gray-500">هیچ عکسی در انتظار تایید نیست.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {candidates.map((c) => (
        <div key={c.id} className="border rounded p-2 flex flex-col items-center">
          <img src={c.previewUrl} alt="Candidate" className="w-full h-32 object-cover rounded mb-2" />
          <span className="text-xs text-gray-600">{new Date(c.createdAt).toLocaleDateString("fa-IR")}</span>
        </div>
      ))}
    </div>
  );
}
