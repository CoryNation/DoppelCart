import { getServerUserOptional } from "@/lib/auth/getServerUser";
import { MainNavClient } from "./MainNavClient";

export async function MainNav() {
  const user = await getServerUserOptional();
  return <MainNavClient user={user} />;
}







