import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-accent text-2xl">{"</>"}</span>
          <h1 className="text-2xl font-bold mt-2 text-white">InstaClone</h1>
          <p className="text-gray-500 text-sm mt-1">Create. Share. Connect.</p>
        </div>

        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/signup"
          appearance={{
            variables: {
              colorPrimary: "#22c55e",
              colorBackground: "#151f32",
              colorText: "#e5e7eb",
              colorInputBackground: "#0d1420",
              colorInputText: "#e5e7eb",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "shadow-none border border-border",
              rootBox: "w-full",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              dividerText: "text-gray-500",
              dividerLine: "bg-border",
              socialButtonsBlockButtonText: "text-gray-200",
              // Same fix as signup page — force visible input text explicitly.
              formFieldInput:
                "bg-[#0d1420] text-gray-200 border border-border focus:border-accent",
              formFieldLabel: "text-gray-300",
              identityPreviewText: "text-gray-200",
              identityPreviewEditButtonIcon: "text-accent",
              footerActionText: "text-gray-400",
              footerActionLink: "text-accent hover:text-accentSoft",
            },
          }}
        />
      </div>
    </div>
  );
}