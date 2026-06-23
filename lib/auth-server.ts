import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "./auth";

/** The logged-in username for the current request, or null. */
export function currentUser(): string | null {
  return verifySession(cookies().get(COOKIE_NAME)?.value);
}
