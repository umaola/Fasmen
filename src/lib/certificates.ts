import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";

const CERTIFICATES_FILE = "certificates.json";

// Mirrors certificates/{certificateId} from firestore-schema.md. All fields
// are snapshotted at issue time (not live-joined to the course/user) so a
// certificate stays correct even if the source course is edited later. The
// id doubles as the public verification code (FR-25/27).
export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  tutorName: string;
  scorePercent: number;
  issuedAt: string;
}

export async function issueCertificate(input: {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  tutorName: string;
  scorePercent: number;
}): Promise<Certificate> {
  const certificate: Certificate = {
    id: randomUUID(),
    studentId: input.studentId,
    studentName: input.studentName,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    tutorName: input.tutorName,
    scorePercent: input.scorePercent,
    issuedAt: new Date().toISOString(),
  };

  await withCollection<Certificate>(CERTIFICATES_FILE, (certificates) => [
    ...certificates,
    certificate,
  ]);
  return certificate;
}

export async function findCertificateById(id: string): Promise<Certificate | undefined> {
  const certificates = await readCollection<Certificate>(CERTIFICATES_FILE);
  return certificates.find((c) => c.id === id);
}

export async function findCertificateByEnrollment(
  studentId: string,
  courseId: string
): Promise<Certificate | undefined> {
  const certificates = await readCollection<Certificate>(CERTIFICATES_FILE);
  return certificates.find((c) => c.studentId === studentId && c.courseId === courseId);
}

export async function listCertificatesByStudent(studentId: string): Promise<Certificate[]> {
  const certificates = await readCollection<Certificate>(CERTIFICATES_FILE);
  return certificates
    .filter((c) => c.studentId === studentId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function listAllCertificates(): Promise<Certificate[]> {
  const certificates = await readCollection<Certificate>(CERTIFICATES_FILE);
  return certificates.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function revokeCertificate(id: string): Promise<void> {
  await withCollection<Certificate>(CERTIFICATES_FILE, (certificates) =>
    certificates.filter((c) => c.id !== id)
  );
}
