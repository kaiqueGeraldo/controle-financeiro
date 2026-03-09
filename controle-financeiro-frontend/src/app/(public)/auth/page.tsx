import AuthScreen from "@/screens/public/auth/authScreen";
import { Suspense } from "react";

export const metadata = {
  title: "Finanças - Auth",
};

export default function AuthPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AuthScreen />
    </Suspense>
  );
}