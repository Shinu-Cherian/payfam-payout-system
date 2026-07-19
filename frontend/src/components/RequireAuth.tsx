"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getToken, type Role, type UserProfile } from "@/lib/api";

export function RequireAuth({
  children,
  role,
}: {
  children: (user: UserProfile) => React.ReactNode;
  role?: Role;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser || (role && storedUser.role !== role)) {
      router.replace("/login");
      return;
    }
    setUser(storedUser);
    setReady(true);
  }, [role, router]);

  if (!ready || !user) {
    return <div className="p-6 text-sm text-[#65736F]">Loading...</div>;
  }

  return <>{children(user)}</>;
}
