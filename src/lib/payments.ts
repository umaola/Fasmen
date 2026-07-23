import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";
import { TUTOR_SHARE } from "./currency";

const PAYMENTS_FILE = "payments.json";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type PayoutStatus = "unpaid" | "paid";

// Mirrors payments/{paymentId} from firestore-schema.md. In the real flow this
// is created "pending" before a Paystack/Flutterwave redirect and confirmed by
// a signature-verified webhook; here there's no gateway, so a purchase is
// created directly as "success" — see createDummySuccessfulPayment.
export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  tutorId: string;
  amount: number; // kobo, snapshot of course.price at purchase time
  currency: "NGN";
  status: PaymentStatus;
  platformFeeAmount: number;
  tutorPayoutAmount: number;
  payoutStatus: PayoutStatus;
  providerReference: string;
  createdAt: string;
  confirmedAt: string | null;
}

export async function createDummySuccessfulPayment(input: {
  studentId: string;
  courseId: string;
  courseTitle: string;
  tutorId: string;
  amount: number;
}): Promise<Payment> {
  const now = new Date().toISOString();
  const tutorPayoutAmount = Math.round(input.amount * TUTOR_SHARE);
  const payment: Payment = {
    id: randomUUID(),
    studentId: input.studentId,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    tutorId: input.tutorId,
    amount: input.amount,
    currency: "NGN",
    status: "success",
    platformFeeAmount: input.amount - tutorPayoutAmount,
    tutorPayoutAmount,
    payoutStatus: "unpaid",
    providerReference: `DUMMY-${randomUUID()}`,
    createdAt: now,
    confirmedAt: now,
  };

  await withCollection<Payment>(PAYMENTS_FILE, (payments) => [...payments, payment]);
  return payment;
}

export async function findPaymentById(id: string): Promise<Payment | undefined> {
  const payments = await readCollection<Payment>(PAYMENTS_FILE);
  return payments.find((p) => p.id === id);
}

export async function listPaymentsByStudent(studentId: string): Promise<Payment[]> {
  const payments = await readCollection<Payment>(PAYMENTS_FILE);
  return payments
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPaymentsByTutor(tutorId: string): Promise<Payment[]> {
  const payments = await readCollection<Payment>(PAYMENTS_FILE);
  return payments
    .filter((p) => p.tutorId === tutorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllPayments(): Promise<Payment[]> {
  const payments = await readCollection<Payment>(PAYMENTS_FILE);
  return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markTutorPaid(paymentIds: string[]): Promise<void> {
  const idSet = new Set(paymentIds);
  await withCollection<Payment>(PAYMENTS_FILE, (payments) =>
    payments.map((p) => (idSet.has(p.id) ? { ...p, payoutStatus: "paid" } : p))
  );
}

export async function listUnpaidPayoutsByTutor(tutorId: string): Promise<Payment[]> {
  const payments = await listPaymentsByTutor(tutorId);
  return payments.filter((p) => p.status === "success" && p.payoutStatus === "unpaid");
}
