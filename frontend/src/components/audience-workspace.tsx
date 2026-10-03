"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import ActivationResult from "@/components/activation-result";

type Customer = {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
};

type CreatedActivation = {
    id: string;
    recipientCount: number;
};

type Props = {
    audienceId: string;
    audienceName: string;
};

export default function AudienceWorkspace({
    audienceId,
    audienceName,
}: Props) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [created, setCreated] = useState<CreatedActivation | null>(null);

    const submitLock = useRef(false);

    useEffect(() => {
        const controller = new AbortController();

        async function loadCustomers() {
            try {
                const response = await fetch(
                    `/api/audiences/${audienceId}/customers`,
                    {
                        signal: controller.signal,
                        cache: "no-store",
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        `โหลดลูกค้าไม่สำเร็จ (HTTP ${response.status})`,
                    );
                }

                const data: Customer[] = await response.json();

                if (!controller.signal.aborted) {
                    setCustomers(data);
                }
            } catch (error: unknown) {
                if (!controller.signal.aborted) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "โหลดลูกค้าไม่สำเร็จ",
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadCustomers();

        return () => controller.abort();
    }, [audienceId]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            submitLock.current ||
            loading ||
            loadError ||
            customers.length === 0 ||
            !message.trim()
        ) {
            return;
        }

        submitLock.current = true;
        setSubmitting(true);
        setSubmitError(null);
        setCreated(null);

        try {
            const response = await fetch("/api/activations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    audienceId,
                    message: message.trim(),
                }),
            });

            if (!response.ok) {
                const body: { message?: string | string[] } =
                    await response.json();

                const errorMessage = Array.isArray(body.message)
                    ? body.message.join(", ")
                    : body.message;

                throw new Error(
                    errorMessage ||
                    `สร้างงานไม่สำเร็จ (HTTP ${response.status})`,
                );
            }

            const data: CreatedActivation = await response.json();

            setCreated(data);
            setMessage("");
        } catch (error: unknown) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "ไม่สามารถยืนยันการสร้างงานได้",
            );
        } finally {
            submitLock.current = false;
            setSubmitting(false);
        }
    }

    return (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">{audienceName}</h2>

            <p className="mt-2 text-sm text-slate-500">
                ตรวจสอบรายชื่อลูกค้าและเขียนข้อความที่จะส่ง
            </p>

            {loading && (
                <p role="status" className="mt-6 text-slate-500">
                    กำลังโหลดลูกค้า...
                </p>
            )}

            {loadError && (
                <p role="alert" className="mt-6 text-red-600">
                    {loadError}
                </p>
            )}

            {!loading && !loadError && (
                <>
                    <p className="mt-6 mb-3 font-medium">
                        ลูกค้าในกลุ่ม {customers.length} คน
                    </p>

                    {customers.length === 0 ? (
                        <p className="text-slate-500">
                            กลุ่มนี้ยังไม่มีลูกค้า จึงยังส่งข้อความไม่ได้
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">ชื่อ</th>
                                        <th scope="col" className="px-4 py-3">เบอร์โทร</th>
                                        <th scope="col" className="px-4 py-3">อีเมล</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {customers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="px-4 py-3">
                                                {customer.name || "ไม่ระบุชื่อ"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {customer.phone || "ไม่มีเบอร์"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {customer.email || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8">
                        <label
                            htmlFor="sms-message"
                            className="mb-2 block font-medium"
                        >
                            ข้อความ SMS
                        </label>

                        <textarea
                            id="sms-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            maxLength={1600}
                            rows={4}
                            required
                            disabled={submitting}
                            placeholder="พิมพ์ข้อความถึงลูกค้า..."
                            className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                        />

                        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-slate-500">
                            <span>ส่งผ่าน Mock SMS ไม่มีการส่ง SMS จริง</span>
                            <span>{message.length}/1600</span>
                        </div>

                        {submitError && (
                            <div role="alert" className="mt-4 text-sm text-red-600">
                                <p>{submitError}</p>
                                <p className="mt-1">
                                    หากการเชื่อมต่อขัดข้อง ให้ตรวจรายการงานก่อนส่งซ้ำ
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                customers.length === 0 ||
                                !message.trim()
                            }
                            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "กำลังสร้างงาน..." : "ส่ง SMS ให้กลุ่มนี้"}
                        </button>
                    </form>
                </>
            )}

            {created && (
                <ActivationResult
                    key={created.id}
                    activationId={created.id}
                />
            )}
        </section>
    );
}