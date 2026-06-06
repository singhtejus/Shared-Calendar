import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="app-header">
      <Link className="brand" href="/">
        Timeshare
      </Link>
      <nav className="nav">
        <Link href="/create">Create</Link>
        <Link href="/join">Join</Link>
        {user ? (
          <form action={logoutAction}>
            <button className="link-button" type="submit">
              Sign out
            </button>
          </form>
        ) : null}
      </nav>
    </header>
  );
}
