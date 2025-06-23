import { ClerkProvider } from "@clerk/nextjs";

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent bg-opacity-80">
        {children}
      </div>
   
  );
}
