import { Inter } from "next/font/google";
import { PlaygroundDemo } from "@/components/demos/playground-demo";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className={`min-h-dvh bg-zinc-50 antialiased ${inter.className}`}>
      <PlaygroundDemo />
    </main>
  );
}
