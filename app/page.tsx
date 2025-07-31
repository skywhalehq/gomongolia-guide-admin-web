'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { httpGet } from "../helper/httpHelper";
import { User } from "@/interfaces/users";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const data = await httpGet<User[]>(
          "https://api.evseg.store/api/v1/guide/admin/users",
        );
        setUsers(data || []);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 grid grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-4xl">
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
          className="dark:invert"
        />

        <section className="w-full">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">Users List</h2>

          {loading && <p>Loading users...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {!loading && !error && users.length === 0 && <p>No users found.</p>}

          {users.length > 0 && (
            <div className="space-y-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-md p-4 shadow-sm bg-white dark:bg-gray-800"
                >
                  <h3 className="text-lg font-semibold mb-1">
                    {user.name || "N/A"} {user.surname || ""}
                    {user.type && (
                      <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        ({user.type})
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-2 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <strong>Phone:</strong> {user.phone || "N/A"}
                    </div>
                    <div>
                      <strong>Commission:</strong> {user.commission}
                    </div>
                    <div>
                      <strong>RD:</strong> {user.rd || "N/A"}
                    </div>
                    <div>
                      <strong>Plate Number:</strong> {user.plate_number || "N/A"}
                    </div>
                    <div>
                      <strong>Car Model:</strong> {user.car_model || "N/A"}
                    </div>
                    <div>
                      <strong>Bank:</strong> {user.bank_name || "N/A"} ({user.bank_code || "N/A"})
                    </div>
                    <div>
                      <strong>Bank Account:</strong> {user.bank_account || "N/A"}
                    </div>
                    <div>
                      <strong>Active:</strong> {user.is_active ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Onboarded:</strong> {user.is_onboarded ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Last Login:</strong> {new Date(user.last_login_at).toLocaleString() || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
