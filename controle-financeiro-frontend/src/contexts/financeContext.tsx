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
import {
  isAbortError,
  useRequestCoordinator,
} from "@/hooks/useRequestCoordinator";

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  saldoTotal: number;
  isLoading: boolean;
  error: Error | null;
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
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoading: isLoadingUser } = useUser();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);

  const fetchData = useCallback(
    async () => {
      if (isLoadingUser || !userId) {
        setIsLoading(false);
        return;
      }

      const request = requests.begin("finance-data");
      setIsLoading(true);
      setError(null);
      try {
        const [accountsResult, categoriesResult] = await Promise.all([
          accountService.getAll(request.signal),
          categoryService.getAll(undefined, request.signal),
        ]);

        if (!request.isCurrent()) return;
        setAccounts(accountsResult.data ?? []);
        setCategories(categoriesResult.data ?? []);
      } catch (error: unknown) {
        if (request.isCurrent() && !isAbortError(error)) {
          setError(
            error instanceof Error
              ? error
              : new Error("Falha ao carregar dados financeiros."),
          );
        }
        if (
          request.isCurrent() &&
          !isAbortError(error) &&
          (!isHttpStatus(error, 403) && !isHttpStatus(error, 401))
        ) {
          console.error("Erro ao carregar dados financeiros", error);
        }
      } finally {
        if (request.isCurrent()) setIsLoading(false);
        request.finish();
      }
    },
    [userId, isLoadingUser, requests],
  );

  useEffect(() => {
    setAccounts([]);
    setCategories([]);
    setError(null);

    if (isLoadingUser) {
      setIsLoading(true);
      return;
    }

    fetchData();
  }, [userId, isLoadingUser, fetchData]);

  useEffect(() => {
    const handleRefresh = () => { void fetchData(); };
    window.addEventListener("refreshFinance", handleRefresh);
    return () => window.removeEventListener("refreshFinance", handleRefresh);
  }, [fetchData]);

  const saldoTotal = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const { mutate: createCategory } = useOptimisticMutation({
    mutationFn: (data: CreateCategoryDTO) => categoryService.create(data),
    onMutate: (data) => {
      const fakeCategory = { ...data, id: `temp-${Date.now()}` } as Category;
      setCategories((previous) => [...previous, fakeCategory]);
      return { temporaryId: fakeCategory.id };
    },
    onError: async (_error, _variables, context) => {
      setCategories((current) =>
        current.filter((category) => category.id !== context.temporaryId),
      );
      await fetchData();
    },
    onSuccess: () => fetchData(),
    getMutationKey: () => "create-category",
    scopeKey: userId,
  });

  const { mutate: updateCategory } = useOptimisticMutation({
    mutationFn: (data: { id: string; payload: Partial<CreateCategoryDTO> }) =>
      categoryService.update(data.id, data.payload),
    onMutate: ({ id, payload }) => {
      const previousCategory = categories.find((category) => category.id === id);
      setCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, ...payload } : category,
        ),
      );
      return { previousCategory };
    },
    onError: async (_error, variables, context) => {
      if (context.previousCategory) {
        setCategories((current) =>
          current.map((category) =>
            category.id === variables.id ? context.previousCategory! : category,
          ),
        );
      }
      await fetchData();
    },
    onSuccess: async () => {
      await fetchData();
      window.dispatchEvent(new Event("refreshExtract"));
    },
    getMutationKey: ({ id }) => id,
    scopeKey: userId,
  });

  const { mutate: deleteCategory } = useOptimisticMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onMutate: (id) => {
      const index = categories.findIndex((category) => category.id === id);
      const deletedCategory = index >= 0 ? categories[index] : undefined;
      setCategories((current) =>
        current.filter((category) => category.id !== id),
      );
      return { deletedCategory, index };
    },
    onError: async (_error, _id, context) => {
      const deletedCategory = context.deletedCategory;
      if (deletedCategory) {
        setCategories((current) => {
          if (current.some((category) => category.id === deletedCategory.id)) {
            return current;
          }
          const restored = [...current];
          restored.splice(Math.max(0, context.index), 0, deletedCategory);
          return restored;
        });
      }
      await fetchData();
    },
    onSuccess: () => {
      window.dispatchEvent(new Event("refreshExtract"));
    },
    getMutationKey: (id) => id,
    scopeKey: userId,
  });

  const contextValue = useMemo(
    () => ({
      accounts,
      categories,
      saldoTotal,
      isLoading,
      error,
      refresh: fetchData,
      createCategory: async (data: CreateCategoryDTO) => {
        await createCategory(data);
      },
      updateCategory: async (id: string, data: Partial<CreateCategoryDTO>) => {
        await updateCategory({ id, payload: data });
      },
      deleteCategory: async (id: string) => {
        await deleteCategory(id);
      },
    }),
    [
      accounts,
      categories,
      saldoTotal,
      isLoading,
      error,
      fetchData,
      createCategory,
      updateCategory,
      deleteCategory,
    ],
  );

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
}

function isHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === status
  );
}

export function useFinanceContext() {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinanceContext must be used within FinanceProvider");
  return context;
}
