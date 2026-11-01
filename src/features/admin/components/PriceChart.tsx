"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PriceChartProps {
  data: Array<{ date: string; price: number }>;
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">داده‌ای برای نمایش وجود ندارد.</p>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={80} />
          <Tooltip
            formatter={(value: any) => [`${Number(value).toLocaleString()} تومان`, "قیمت"]}
            labelFormatter={(label) => `تاریخ: ${label}`}
          />
          <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
