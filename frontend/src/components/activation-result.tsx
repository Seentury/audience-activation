"use client";

import { useEffect, useState } from "react";

type Status = "Pending" | "Processing" | "Success" | "Failed";

type Recipient = {
  id: string;
  customerName: string | null;
  phone: string | null;
  status: Status;
  errorMessage: string | null;
};

type Activation = {
  id: string;
  message: string;
  status: Status;
  errorMessage: string | null;
  recipientCount: number;
  recipients: Recipient[];
};

const statusStyles: Record<Status, string> = {
  Pending: "bg-slate-100 text-slate-700",
  Processing: "bg-blue-100 text-blue-700",
  Success: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function ActivationResult({
  activationId,
}: {
  activationId: string;
}) {
  const [activation, setActivation] = useState<Activation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      let shouldContinue = true;

      try {
        const response = await fetch(
          `/api/activations/${activationId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`โหลดสถานะไม่สำเร็จ (HTTP ${response.status})`);
        }

        const data: Activation = await response.json();

        if (controller.signal.aborted) return;

        setActivation(data);
        setError(null);

        shouldContinue =
          data.status === "Pending" || data.status === "Processing";
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "ไม่สามารถเชื่อมต่อเพื่อโหลดสถานะได้",
        );
      }

      if (!controller.signal.aborted && shouldContinue) {
        timer = setTimeout(poll, 2000);
      }
    }

    void poll();

    return () => {
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [activationId]);

  const successCount =
    activation?.recipients.filter((item) => item.status === "Success").length ??
    0;

  const failedCount =
    activation?.recipients.filter((item) => item.status === "Failed").length ??
    0;

  const finished =
    activation?.status === "Success" || activation?.status === "Failed";

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">ผลการส่งข้อความ</h3>

        <div role="status">
          {activation ? (
            <StatusBadge status={activation.status} />
          ) : (
            <span className="text-sm text-slate-500">
              กำลังโหลดสถานะ...
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 break-all text-xs text-slate-500">
        รหัสงาน: {activationId}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
        >
          {error} — ระบบจะลองโหลดใหม่อัตโนมัติ
        </p>
      )}

      {activation && (
        <>
          <p className="mt-4 whitespace-pre-wrap break-words text-slate-700">
            {activation.message}
          </p>

          <p className="mt-4 text-sm font-medium" role="status">
            ผู้รับ {activation.recipientCount} คน · สำเร็จ {successCount} คน ·
            ล้มเหลว {failedCount} คน
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {finished
              ? "ประมวลผลเสร็จแล้ว"
              : "กำลังติดตามผลการส่ง อัปเดตอัตโนมัติ"}
          </p>

          {activation.errorMessage && (
            <p className="mt-3 text-sm text-red-700">
              รายละเอียดงาน: {activation.errorMessage}
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">ลูกค้า</th>
                  <th className="px-4 py-3">เบอร์โทร</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {activation.recipients.map((recipient) => (
                  <tr key={recipient.id}>
                    <td className="px-4 py-3">
                      {recipient.customerName ?? "ไม่ระบุชื่อ"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {recipient.phone ?? "ไม่มีเบอร์"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={recipient.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {recipient.errorMessage ??
                        (recipient.status === "Success"
                          ? "ส่งผ่าน Mock SMS สำเร็จ"
                          : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}