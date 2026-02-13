import { getSubjects } from "@/app/actions";
import JEECoachApp from "@/components/JEECoachApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const subjects = await getSubjects();
  return <JEECoachApp initialSubjects={subjects} />;
}
