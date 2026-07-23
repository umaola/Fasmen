import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { findCertificateById } from "@/lib/certificates";

const PRIMARY_900 = rgb(0x0b / 255, 0x25 / 255, 0x45 / 255);
const ACCENT_600 = rgb(0xe0 / 255, 0x86 / 255, 0x2a / 255);
const NEUTRAL_700 = rgb(0x3f / 255, 0x46 / 255, 0x51 / 255);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const { certificateId } = await params;
  const certificate = await findCertificateById(certificateId);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape, in points
  const { width, height } = page.getSize();

  const heading = await doc.embedFont(StandardFonts.HelveticaBold);
  const body = await doc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: PRIMARY_900,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: ACCENT_600,
    borderWidth: 1,
  });

  page.drawText("CERTIFICATE OF COMPLETION", {
    x: width / 2 - heading.widthOfTextAtSize("CERTIFICATE OF COMPLETION", 22) / 2,
    y: height - 120,
    size: 22,
    font: heading,
    color: PRIMARY_900,
  });

  page.drawText("This certifies that", {
    x: width / 2 - body.widthOfTextAtSize("This certifies that", 13) / 2,
    y: height - 175,
    size: 13,
    font: body,
    color: NEUTRAL_700,
  });

  page.drawText(certificate.studentName, {
    x: width / 2 - heading.widthOfTextAtSize(certificate.studentName, 30) / 2,
    y: height - 220,
    size: 30,
    font: heading,
    color: PRIMARY_900,
  });

  const completionLine = `has successfully completed`;
  page.drawText(completionLine, {
    x: width / 2 - body.widthOfTextAtSize(completionLine, 13) / 2,
    y: height - 260,
    size: 13,
    font: body,
    color: NEUTRAL_700,
  });

  page.drawText(certificate.courseTitle, {
    x: width / 2 - heading.widthOfTextAtSize(certificate.courseTitle, 20) / 2,
    y: height - 295,
    size: 20,
    font: heading,
    color: ACCENT_600,
  });

  const detailsLine = `Instructor: ${certificate.tutorName}   ·   Score: ${certificate.scorePercent}%   ·   Issued: ${new Date(
    certificate.issuedAt
  ).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}`;
  page.drawText(detailsLine, {
    x: width / 2 - body.widthOfTextAtSize(detailsLine, 12) / 2,
    y: height - 330,
    size: 12,
    font: body,
    color: NEUTRAL_700,
  });

  const origin = request.nextUrl.origin;
  const verifyUrl = `${origin}/verify/${certificate.id}`;

  page.drawText("Verification code", {
    x: 64,
    y: 90,
    size: 10,
    font: heading,
    color: NEUTRAL_700,
  });
  page.drawText(certificate.id, {
    x: 64,
    y: 72,
    size: 11,
    font: body,
    color: PRIMARY_900,
  });

  page.drawText("Verify at", {
    x: 64,
    y: 54,
    size: 10,
    font: body,
    color: NEUTRAL_700,
  });
  page.drawText(verifyUrl, {
    x: 120,
    y: 54,
    size: 10,
    font: body,
    color: PRIMARY_900,
  });

  const pdfBytes = await doc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${certificate.id}.pdf"`,
    },
  });
}
