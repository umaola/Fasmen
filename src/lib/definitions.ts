import * as z from "zod";

export const SignupFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { error: "Name must be at least 2 characters long." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
  role: z.enum(["student", "tutor"], { error: "Choose an account type." }),
});

export const LoginFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

export type SignupState =
  | {
      errors?: {
        displayName?: string[];
        email?: string[];
        password?: string[];
        role?: string[];
      };
      message?: string;
    }
  | undefined;

export type LoginState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const CreateCourseFormSchema = z.object({
  title: z.string().min(4, { error: "Title must be at least 4 characters." }).trim(),
  description: z
    .string()
    .min(20, { error: "Description must be at least 20 characters." })
    .trim(),
  category: z.string().min(1, { error: "Choose a category." }),
  tags: z.string().trim(),
  priceNaira: z.coerce
    .number({ error: "Enter a valid price." })
    .min(0, { error: "Price can't be negative." }),
  language: z.string().min(1, { error: "Choose a language." }),
  level: z.enum(["beginner", "intermediate", "advanced"], { error: "Choose a level." }),
  passThresholdPercent: z.coerce
    .number({ error: "Enter a valid pass threshold." })
    .min(1, { error: "Must be at least 1%." })
    .max(100, { error: "Can't exceed 100%." }),
  maxAttempts: z.coerce
    .number({ error: "Enter a valid attempt limit." })
    .min(1, { error: "Must allow at least 1 attempt." }),
});

export type CreateCourseState =
  | {
      errors?: {
        title?: string[];
        description?: string[];
        category?: string[];
        tags?: string[];
        priceNaira?: string[];
        language?: string[];
        level?: string[];
        passThresholdPercent?: string[];
        maxAttempts?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const AddLessonFormSchema = z
  .object({
    title: z.string().min(2, { error: "Title must be at least 2 characters." }).trim(),
    type: z.enum(["reading", "video"], { error: "Choose a lesson type." }),
    content: z.string().trim(),
    videoGuid: z.string().min(1).optional().or(z.literal("")),
    videoDurationSeconds: z.coerce
      .number({ error: "Enter a valid duration." })
      .min(1, { error: "Must be at least 1 second." })
      .optional(),
    isPreview: z.enum(["on"]).optional(),
  })
  .refine((v) => v.type !== "reading" || v.content.length >= 10, {
    path: ["content"],
    error: "Content must be at least 10 characters.",
  })
  .refine((v) => v.type !== "video" || !!v.videoGuid, {
    path: ["videoGuid"],
    error: "Upload a video.",
  });

export type AddLessonState =
  | {
      errors?: {
        title?: string[];
        type?: string[];
        content?: string[];
        videoGuid?: string[];
        videoDurationSeconds?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const RejectCourseFormSchema = z.object({
  feedback: z.string().min(10, { error: "Give at least a sentence of feedback." }).trim(),
});

export type RejectCourseState =
  | {
      errors?: {
        feedback?: string[];
      };
      message?: string;
    }
  | undefined;

export const TUTOR_ID_TYPES = ["nin", "voters-card", "passport", "drivers-license"] as const;

export const TutorVerificationFormSchema = z.object({
  idType: z.enum(TUTOR_ID_TYPES, { error: "Choose an ID type." }),
  idNumber: z.string().min(4, { error: "Enter a valid ID number." }).max(20).trim(),
  bio: z
    .string()
    .min(20, { error: "Write at least a sentence or two about yourself." })
    .max(500, { error: "Bio can't exceed 500 characters." })
    .trim(),
  username: z
    .string()
    .min(3, { error: "Must be at least 3 characters." })
    .max(30, { error: "Can't exceed 30 characters." })
    .regex(/^[a-z0-9-]+$/i, { error: "Letters, numbers, and hyphens only." })
    .trim(),
});

export type TutorVerificationState =
  | {
      errors?: {
        idType?: string[];
        idNumber?: string[];
        bio?: string[];
        username?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export type ImageUploadState =
  | {
      message?: string;
      success?: boolean;
    }
  | undefined;

export const SubscribeFormSchema = z.object({
  plan: z.enum(["creator", "enterprise"], { error: "Choose a plan." }),
  billingPeriodMonths: z.coerce.number().refine((n) => [1, 12].includes(n), {
    error: "Choose a billing period.",
  }),
});

export type SubscribeState =
  | {
      errors?: {
        plan?: string[];
        billingPeriodMonths?: string[];
      };
      message?: string;
    }
  | undefined;

export const PayoutAccountFormSchema = z.object({
  bankName: z.string().min(1, { error: "Choose a bank." }),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, { error: "Enter a valid 10-digit account number." }),
});

export type PayoutAccountState =
  | {
      errors?: {
        bankName?: string[];
        accountNumber?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const ReviewFormSchema = z.object({
  rating: z.coerce
    .number({ error: "Choose a rating." })
    .min(1, { error: "Choose a rating." })
    .max(5, { error: "Rating can't exceed 5." }),
  comment: z
    .string()
    .min(10, { error: "Share at least a sentence about your experience." })
    .trim(),
});

export type ReviewState =
  | {
      errors?: {
        rating?: string[];
        comment?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export const AddQuestionFormSchema = z.object({
  questionText: z.string().min(5, { error: "Question must be at least 5 characters." }).trim(),
  type: z.enum(["single-choice", "multi-choice"], { error: "Choose a question type." }),
  optionsRaw: z.string().min(1, { error: "Add at least two options, one per line." }),
  correctIndexesRaw: z.string().min(1, { error: "Mark which option(s) are correct." }),
  points: z.coerce.number({ error: "Enter a valid points value." }).min(1, { error: "Must be at least 1." }),
});

export type AddQuestionState =
  | {
      errors?: {
        questionText?: string[];
        type?: string[];
        optionsRaw?: string[];
        correctIndexesRaw?: string[];
        points?: string[];
      };
      message?: string;
    }
  | undefined;

export const UpdateProfileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { error: "Name must be at least 2 characters long." })
    .trim(),
  bio: z.string().trim().max(500, { error: "Bio can't exceed 500 characters." }),
});

export type UpdateProfileState =
  | {
      errors?: {
        displayName?: string[];
        bio?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;
