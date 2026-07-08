import Link from "next/link";
import React from "react";

/**
 * parseCaption — converts caption text into an array of strings + Link components.
 * Detects:
 *   - #hashtag → links to /explore?tag=foo
 *   - @mention → links to /profile/username
 * Anything else is plain text.
 *
 * Examples:
 *   "Loving summer! #beach #travel with @priyanshu"
 *   → ["Loving summer! ", <Link>/, <Link>, " with ", <Link>]
 */
export function parseCaption(text) {
  if (!text) return null;

  // Regex matches #word (letters, digits, _) and @word (no spaces)
  const regex = /(#|@)([a-zA-Z0-9_.]+)/g;
  const parts = [];
  let lastIdx = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const [full, prefix, value] = match;
    const start = match.index;

    // Push plain text before the match
    if (start > lastIdx) {
      parts.push(text.slice(lastIdx, start));
    }

    if (prefix === "#") {
      parts.push(
        <Link
          key={`h-${key++}`}
          href={`/explore?tag=${encodeURIComponent(value.toLowerCase())}`}
          className="text-blue-400 hover:underline"
        >
          #{value}
        </Link>
      );
    } else if (prefix === "@") {
      parts.push(
        <Link
          key={`m-${key++}`}
          href={`/profile/${value}`}
          className="text-blue-400 hover:underline"
        >
          @{value}
        </Link>
      );
    }

    lastIdx = start + full.length;
  }

  // Push the remaining plain text
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length === 0 ? text : parts;
}
