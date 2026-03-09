import { Suspense } from "react";
import PrivateLayout from "@/layouts/PrivateLayout";

export default function PrivateLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Carregando layout...</div>}>
      <PrivateLayout>{children}</PrivateLayout>
    </Suspense>
  );
}
