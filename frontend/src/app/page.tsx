"use client";

import { useEffect, useState } from "react";
import AudienceWorkspace from "@/components/audience-workspace";
import ActivationHistory from "@/components/activation-history";

type Audience = {
  id: string;
  externalId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Home() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAudiences() {
      try {
        const response = await fetch("/api/audiences", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `โหลด Audience ไม่สำเร็จ (HTTP ${response.status})`,
          );
        }

        const data: Audience[] = await response.json();

        if (!controller.signal.aborted) {
          setAudiences(data);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAudiences();

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold tracking-widest text-indigo-600">
            AUDIENCE ACTIVATION
          </p>

          <h1 className="text-3xl font-bold">
            กลุ่มลูกค้า
          </h1>

          <p className="mt-3 text-slate-600">
            รายชื่อ Audience สำหรับส่งข้อความ SMS
          </p>
        </header>

        {loading && (
          <p role="status" className="text-slate-500">
            กำลังโหลดข้อมูล...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            <p>{error}</p>
            <p className="mt-2 text-sm">
              ตรวจว่า Backend ทำงานอยู่ แล้วรีเฟรชหน้าเว็บอีกครั้ง
            </p>
          </div>
        )}

        {!loading && !error && audiences.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            ยังไม่มี Audience ในระบบ
          </div>
        )}

        {!loading && !error && audiences.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              ทั้งหมด {audiences.length} กลุ่ม
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              {audiences.map((audience) => (
                <article
                  key={audience.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-semibold">
                    {audience.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    รหัสต้นทาง: {audience.externalId}
                  </p>

                  <p className="mt-5 text-slate-600">
                    {audience.description || "ไม่มีคำอธิบาย"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedAudience(audience)}
                    aria-pressed={selectedAudience?.id === audience.id}
                    className="mt-5 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    {selectedAudience?.id === audience.id
                      ? "กำลังเลือกกลุ่มนี้"
                      : "เลือกลุ่มนี้"}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      {selectedAudience && (
        <AudienceWorkspace
          key={selectedAudience.id}
          audienceId={selectedAudience.id}
          audienceName={selectedAudience.name}
        />

      )}
      <ActivationHistory />
    </main>

  );
}