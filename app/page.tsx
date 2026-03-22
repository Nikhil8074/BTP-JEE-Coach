import { getSubjects } from "@/app/actions";
import JEECoachAppClient from "@/components/JEECoachAppClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const subjects = await getSubjects();
  return <JEECoachAppClient initialSubjects={subjects} />;
}
