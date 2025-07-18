import type { Metadata } from "next";
import { Geist, Geist_Mono,Hind,Poppins ,Fredericka_the_Great} from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/header";
import { SidebarProvider } from "@/components/Sidebarprovide";
import Notification from "@/components/ui/notifications";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Sidebar from "@/components/ui/sidebar";
import { CreatenewChatProvider } from "@/components/ui/CreatenewChatProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const Fredericka = Fredericka_the_Great({
  variable: "--font-Fredericka_the_Great",
  subsets: ["latin"],
  display: "swap",
  weight: "400"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "700"],
  display: "swap",
});
const hind = Hind({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-hind",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <ClerkProvider>
      <CreatenewChatProvider>
        <SidebarProvider>
          <html lang="en">
            <body
              className={`
                ${cormorant.variable} 
                ${inter.variable} 
                ${geistSans.variable} 
                ${geistMono.variable} 
                ${hind.variable} 
                ${poppins.variable}
                ${Fredericka.variable}
                antialiased 
                h-screen
                w-screen
                bg-black
              `}
            >
              <div className="relative w-screen h-screen md:flex">
                {/* 🔮 Background Image */}
                <div
                  className="absolute inset-0 h-screen w-screen bg-cover bg-center z-0 transition-all duration-1000"
                  style={{
                    backgroundImage: "url('/_.jpeg')",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                />

                {/*  Dark overlay for contrast */}
                <div className="fixed inset-0 bg-gradient-to-tr from-black/80 via-black/60 to-transparent z-10 backdrop-blur-sm" />

                {/*  Mobile fallback overlay */}
                <div className="md:hidden absolute inset-0 bg-black/30 backdrop-blur-md z-20 pointer-events-none" />

                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className=" absolute flex w-screen h-screen  flex-col relative z-30">
                  <Header />
                  {/* <Notification />  */}
                  <main
                    
                    className="flex-1 min-h-0 flex flex-col px-4 md:px-6 overflow-y-auto mb-2  text-white"
                  >
                    {children}
                  </main>
                </div>
              </div>
            </body>
          </html>
        </SidebarProvider>
      </CreatenewChatProvider>
    </ClerkProvider>
  );
}
