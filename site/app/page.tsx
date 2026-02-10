import { Inter } from "next/font/google";
import { PlaygroundDemo } from "@/components/demos/playground-demo";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className={`pg-page ${inter.className}`}>
      <PlaygroundDemo />
    </main>
  );
}
