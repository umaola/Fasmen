"use client";

import { useState } from "react";
import { ShareIcon, CopyIcon, CheckIcon, CloseIcon } from "@/components/icons";

interface ShareCertificateButtonProps {
  certificateId: string;
  courseTitle: string;
}

export function ShareCertificateButton({
  certificateId,
  courseTitle,
}: ShareCertificateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getVerifyUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/verify/${certificateId}`;
    }
    return `https://fasmen.com/verify/${certificateId}`;
  };

  const verifyUrl = getVerifyUrl();
  const shareText = `I just earned my certified credential in "${courseTitle}" on FASMEN! View my verified certificate here:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText} ${verifyUrl}`
  )}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(verifyUrl)}`;
  const linkedinPostUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    verifyUrl
  )}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
      >
        <ShareIcon className="h-3.5 w-3.5 text-neutral-600" />
        <span>Share</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-primary-900">
                  Share Your Certificate
                </h3>
                <p className="text-xs text-neutral-600">
                  Showcase your verified achievement to your network
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Public Verification Link
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={verifyUrl}
                    className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-900 px-3 text-xs font-medium text-white transition hover:bg-primary-800"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Share to Social Networks
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <span className="font-bold text-sm text-emerald-600">WhatsApp</span>
                    <span className="text-[10px] text-emerald-700">Send to Chat</span>
                  </a>

                  <a
                    href={linkedinPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                  >
                    <span className="font-bold text-sm text-sky-700">LinkedIn</span>
                    <span className="text-[10px] text-sky-600">Share Post</span>
                  </a>

                  <a
                    href={xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-neutral-50 p-3 text-xs font-medium text-neutral-900 transition hover:bg-neutral-100"
                  >
                    <span className="font-bold text-sm text-neutral-900">X (Twitter)</span>
                    <span className="text-[10px] text-neutral-600">Post Tweet</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
