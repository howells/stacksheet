import { JetBrains_Mono } from "next/font/google";
import { PlaygroundDemo } from "@/components/demos/playground-demo";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function Home() {
  return (
    <main
      className={`min-h-dvh lg:h-dvh lg:overflow-hidden antialiased ${mono.variable}`}
      style={{ backgroundColor: "#fafaf9" }}
    >
      <PlaygroundDemo />
    </main>
  );
}
