import type { Metadata } from "next";
import { FraudGuardScreen } from "@/screens/fraud-guard-screen";

export const metadata: Metadata = {
  title: "安心保鑣｜理財防詐練習",
  description: "先暫停、後查證；ROCK 練習與本機黑白名單。非自動偵測詐騙。",
};

export default function FraudGuardPage() {
  return <FraudGuardScreen />;
}
