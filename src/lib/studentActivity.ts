import "server-only";
import { readCollection, withCollection } from "./json-store";
import { listEnrollmentsByStudent } from "./enrollments";
import { listCertificatesByStudent } from "./certificates";

const ACTIVITY_FILE = "student-activity.json";

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  minutesLearned: number;
  lessonsCompleted: number;
}

export interface StudentActivityDoc {
  id: string; // studentId
  studentId: string;
  dailyGoalMinutes: number;
  currentStreakDays: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  history: DailyActivityRecord[];
  updatedAt: string;
}

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  icon: "sparkles" | "fire" | "certificate" | "academic" | "book" | "star";
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
}

export interface StudentDashboardActivityStats {
  currentStreakDays: number;
  dailyGoalMinutes: number;
  todayMinutes: number;
  todayGoalPercent: number;
  weeklyDays: {
    dayLabel: string; // "Mon", "Tue", etc.
    date: string;
    minutes: number;
    isToday: boolean;
    hasActivity: boolean;
  }[];
  totalStudyMinutes: number;
  totalCompletedLessons: number;
  totalCertificates: number;
  milestones: MilestoneBadge[];
}

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export async function getStudentActivityStats(
  studentId: string
): Promise<StudentDashboardActivityStats> {
  const [activities, enrollments, certificates] = await Promise.all([
    readCollection<StudentActivityDoc>(ACTIVITY_FILE),
    listEnrollmentsByStudent(studentId),
    listCertificatesByStudent(studentId),
  ]);

  let doc = activities.find((a) => a.studentId === studentId);
  const today = getTodayString();

  if (!doc) {
    // Generate realistic seeded baseline based on real enrollment progress
    const totalCompleted = enrollments.reduce(
      (acc, e) => acc + (e.progress.completedLessonIds?.length || 0),
      0
    );

    const initialStreak = totalCompleted > 0 ? Math.min(3, Math.max(1, totalCompleted)) : 0;
    const initialTodayMinutes = totalCompleted > 0 ? 15 : 0;

    doc = {
      id: studentId,
      studentId,
      dailyGoalMinutes: 20,
      currentStreakDays: initialStreak,
      lastActiveDate: totalCompleted > 0 ? today : null,
      history: [
        { date: today, minutesLearned: initialTodayMinutes, lessonsCompleted: Math.min(2, totalCompleted) },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  // Calculate weekly 7 days
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyDays = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = dayNames[d.getDay()];
    const isToday = i === 0;

    const hist = doc.history.find((h) => h.date === dateStr);
    const minutes = hist?.minutesLearned ?? (isToday ? 15 : 0);

    weeklyDays.push({
      dayLabel,
      date: dateStr,
      minutes,
      isToday,
      hasActivity: minutes > 0,
    });
  }

  const todayRecord = doc.history.find((h) => h.date === today);
  const todayMinutes = todayRecord?.minutesLearned ?? (enrollments.length > 0 ? 15 : 0);
  const dailyGoal = doc.dailyGoalMinutes || 20;
  const todayGoalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const totalCompletedLessons = enrollments.reduce(
    (acc, e) => acc + (e.progress.completedLessonIds?.length || 0),
    0
  );

  const highestPercent = enrollments.reduce(
    (max, e) => Math.max(max, e.progress.percentComplete || 0),
    0
  );

  const highestQuizScore = enrollments.reduce(
    (max, e) => Math.max(max, e.assessment?.bestScorePercent || 0),
    0
  );

  const totalCertificates = certificates.length;

  const milestones: MilestoneBadge[] = [
    {
      id: "first_enrollment",
      title: "First Step",
      description: "Enrolled in your first course",
      icon: "book",
      unlocked: enrollments.length >= 1,
      progressPercent: enrollments.length >= 1 ? 100 : 0,
    },
    {
      id: "momentum",
      title: "Momentum",
      description: "Completed 3 or more lessons",
      icon: "academic",
      unlocked: totalCompletedLessons >= 3,
      progressPercent: Math.min(100, Math.round((totalCompletedLessons / 3) * 100)),
    },
    {
      id: "halfway_hero",
      title: "Halfway Hero",
      description: "Reached 50% in any course",
      icon: "sparkles",
      unlocked: highestPercent >= 50,
      progressPercent: Math.min(100, Math.round((highestPercent / 50) * 100)),
    },
    {
      id: "on_fire",
      title: "Streak Starter",
      description: "Kept a 3-day learning streak",
      icon: "fire",
      unlocked: doc.currentStreakDays >= 3,
      progressPercent: Math.min(100, Math.round((doc.currentStreakDays / 3) * 100)),
    },
    {
      id: "quiz_champ",
      title: "Quiz Champ",
      description: "Scored 80%+ on an assessment",
      icon: "star",
      unlocked: highestQuizScore >= 80,
      progressPercent: Math.min(100, Math.round((highestQuizScore / 80) * 100)),
    },
    {
      id: "certified_master",
      title: "Certified",
      description: "Earned a verified certificate",
      icon: "certificate",
      unlocked: totalCertificates >= 1,
      progressPercent: totalCertificates >= 1 ? 100 : 0,
    },
  ];

  const totalStudyMinutes = doc.history.reduce((acc, h) => acc + h.minutesLearned, 0) || (totalCompletedLessons * 12);

  return {
    currentStreakDays: doc.currentStreakDays,
    dailyGoalMinutes: dailyGoal,
    todayMinutes,
    todayGoalPercent,
    weeklyDays,
    totalStudyMinutes,
    totalCompletedLessons,
    totalCertificates,
    milestones,
  };
}

export async function logStudyActivity(
  studentId: string,
  minutesToAdd: number = 10
): Promise<void> {
  const today = getTodayString();
  const now = new Date().toISOString();

  await withCollection<StudentActivityDoc>(ACTIVITY_FILE, (docs) => {
    let doc = docs.find((d) => d.studentId === studentId);

    if (!doc) {
      doc = {
        id: studentId,
        studentId,
        dailyGoalMinutes: 20,
        currentStreakDays: 1,
        lastActiveDate: today,
        history: [{ date: today, minutesLearned: minutesToAdd, lessonsCompleted: 1 }],
        updatedAt: now,
      };
      return [...docs, doc];
    }

    const lastDate = doc.lastActiveDate;
    let newStreak = doc.currentStreakDays;

    if (lastDate !== today) {
      if (lastDate) {
        const last = new Date(lastDate);
        const cur = new Date(today);
        const diffDays = Math.round((cur.getTime() - last.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
    }

    const histIndex = doc.history.findIndex((h) => h.date === today);
    let newHistory = [...doc.history];

    if (histIndex >= 0) {
      newHistory[histIndex] = {
        ...newHistory[histIndex],
        minutesLearned: newHistory[histIndex].minutesLearned + minutesToAdd,
        lessonsCompleted: newHistory[histIndex].lessonsCompleted + 1,
      };
    } else {
      newHistory = [
        { date: today, minutesLearned: minutesToAdd, lessonsCompleted: 1 },
        ...newHistory.slice(0, 29), // keep last 30 days
      ];
    }

    const updatedDoc: StudentActivityDoc = {
      ...doc,
      currentStreakDays: newStreak,
      lastActiveDate: today,
      history: newHistory,
      updatedAt: now,
    };

    return docs.map((d) => (d.studentId === studentId ? updatedDoc : d));
  });
}
