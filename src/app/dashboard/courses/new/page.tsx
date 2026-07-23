import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { NewCourseForm } from "./NewCourseForm";

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  return <NewCourseForm />;
}
