import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import Avatar from "../components/UI/Avatar";
import api from "../lib/api";

export default function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    // Debounce so we don't spam the API on every keystroke
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/search/${encodeURIComponent(query.trim())}`);
        setUsers(data.users);
      } catch (err) {
        // silent fail on search is fine — no need to toast every keystroke error
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-4">Search</h1>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or name..."
          className="w-full bg-surface2 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent mb-4"
        />

        {loading && <p className="text-sm text-gray-500">Searching...</p>}

        <div className="space-y-1">
          {users.map((u) => (
            <Link
              key={u._id}
              href={`/profile/${u.username}`}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface2"
            >
              <Avatar src={u.avatar?.url} name={u.name} size={40} />
              <div>
                <p className="text-sm font-medium">{u.username}</p>
                <p className="text-xs text-gray-500">{u.name}</p>
              </div>
            </Link>
          ))}
          {!loading && query.trim() && users.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No users found</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
