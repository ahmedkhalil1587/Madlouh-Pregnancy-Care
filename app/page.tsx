import { requireSessionUser } from "./auth";
import PregnancyApp from "./pregnancy-app";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await requireSessionUser("/");
  return <PregnancyApp authName={user.displayName} />;
}
