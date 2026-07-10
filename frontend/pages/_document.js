import { Html, Head, Main, NextScript } from "next/document";

// Runs before React hydrates. Reads the saved theme (default: dark) and
// applies the "light" class to <html> synchronously, so there's never a
// flash of the wrong theme on load or on refresh.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("instaclone-theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}