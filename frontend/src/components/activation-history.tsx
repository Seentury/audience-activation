"use client";

import { useEffect, useState } from "react";
import ActivationResult from "@/components/activation-result";

type ActivationSummary = {
  id: string;
  audienceName: string;
  message: string;
  status: "Pending" | "Processing" | "Success" | "Failed";
  createdAt: string;
};

export default function ActivationHistory() {
  const [items, setItems] = useState<ActivationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/activations", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `โหลดประวัติไม่สำเร็จ (HTTP ${response.status})`,
          );
        }

        const data: ActivationSummary[] = await response.json();

        if (!controller.signal.aborted) {
          setItems(data);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "ไม่สามารถโหลดประวัติได้",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => controller.abort();
  }, [refreshKey]);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">ประวัติการส่งข้อความ</h2>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "กำลังโหลด..." : "รีเฟรชประวัติ"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        ประวัติทุกกลุ่ม เรียงจากงานล่าสุด กดดูผลเพื่อเปิดรายละเอียดรายคน
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          กำลังโหลดประวัติ...
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          ยังไม่มีประวัติการส่งข้อความ
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">วันที่สร้าง</th>
                <th className="px-4 py-3">กลุ่มลูกค้า</th>
                <th className="px-4 py-3">ข้อความ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ผลการส่ง</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(item.createdAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>

                  <td className="px-4 py-3">{item.audienceName}</td>

                  <td className="px-4 py-3">
                    <p className="max-w-xs truncate" title={item.message}>
                      {item.message}
                    </p>
                  </td>

                  <td className="px-4 py-3">{item.status}</td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-pressed={selectedId === item.id}
                      className="whitespace-nowrap font-medium text-indigo-700 underline"
                    >
                      {selectedId === item.id ? "กำลังแสดง" : "ดูผล"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && (
        <ActivationResult
          key={selectedId}
          activationId={selectedId}
        />
      )}
    </section>
  );
}