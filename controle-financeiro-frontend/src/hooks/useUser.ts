import { useUserContext } from "@/contexts/userContext";

export function useUser() {
  return useUserContext();
}
