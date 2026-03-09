import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { accountService } from "@/services/accountService";
import { categoryService } from "@/services/categoryService";
import { Account, Category, CreateCategoryDTO } from "@/types";
import { useUser } from "@/hooks/useUser";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  saldoTotal: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  createCategory: (data: CreateCategoryDTO) => Promise<void>;
  updateCategory: (
    id: string,
    data: Partial<CreateCategoryDTO>,
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: isLoadingUser } = useUser();
  const userId = user?.id;

  const fetchData = useCallback(
    async (forceCategories = false) => {
      if (isLoadingUser || !userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const promises: Promise<any>[] = [accountService.getAll()];

        const shouldFetchCats = categories.length === 0 || forceCategories;
        if (shouldFetchCats) {
          promises.push(categoryService.getAll());
        }

        const results = await Promise.all(promises);

        if (results[0]?.data) setAccounts(results[0].data);
        if (shouldFetchCats && results[1]?.data) {
          setCategories(results[1].data);
        }
      } catch (error: any) {
        if (error.status !== 403 && error.status !== 401) {
          console.error("Erro ao carregar dados financeiros", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userId, isLoadingUser, categories.length],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saldoTotal = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const { mutate: createCategory } = useOptimisticMutation({
    mutationFn: (data: CreateCategoryDTO) => categoryService.create(data),
    onMutate: (data) => {
      const prev = [...categories];
      const fakeCategory = { ...data, id: `temp-${Date.now()}` } as Category;
      setCategories([...prev, fakeCategory]);
      return prev;
    },
    onError: (err, vars, prev) => setCategories(prev),
    onSuccess: () => fetchData(true),
  });

  const { mutate: updateCategory } = useOptimisticMutation({
    mutationFn: (data: { id: string; payload: Partial<CreateCategoryDTO> }) =>
      categoryService.update(data.id, data.payload),
    onMutate: ({ id, payload }) => {
      const prev = [...categories];
      setCategories(
        prev.map((c) => (c.id === id ? { ...c, ...payload } : c)) as Category[],
      );
      return prev;
    },
    onError: (err, vars, prev) => setCategories(prev),
    onSuccess: () => window.dispatchEvent(new Event("refreshExtract")),
  });

  const { mutate: deleteCategory } = useOptimisticMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onMutate: (id) => {
      const prev = [...categories];
      setCategories(prev.filter((c) => c.id !== id));
      return prev;
    },
    onError: (err, id, prev) => setCategories(prev),
    onSuccess: () => window.dispatchEvent(new Event("refreshExtract")),
  });

  const contextValue = useMemo(
    () => ({
      accounts,
      categories,
      saldoTotal,
      isLoading,
      refresh: fetchData,
      createCategory: async (data: CreateCategoryDTO) => createCategory(data),
      updateCategory: async (id: string, data: Partial<CreateCategoryDTO>) =>
        updateCategory({ id, payload: data }),
      deleteCategory: async (id: string) => deleteCategory(id),
    }),
    [accounts, categories, saldoTotal, isLoading, fetchData],
  );

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceContext() {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinanceContext must be used within FinanceProvider");
  return context;
}
