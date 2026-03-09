export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type AccountType = "CHECKING" | "INVESTMENT" | "CASH" | "SAVINGS";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  isArchived: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  isPaid: boolean;
  type: TransactionType;
  accountId: string;
  categoryId?: string;
  categoryName?: string;
  accountName?: string;
  category?: Category;
  account?: Account;
  isSystemManaged?: boolean;
}

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
}

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  date: string;
  time: string;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  isPaid: boolean;
}

export interface CreateCategoryDTO {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export type PlanStatus = "PENDING" | "SAVED" | "PAID";

export interface PlanItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: PlanStatus;
  category?: Category;
  categoryId: string;
  cardId?: string;
  categoryName?: string;
  categoryIcon?: string;
}

export interface CreatePlanItemDTO {
  description: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  status: PlanStatus;
}

export interface MonthlyPlanResponse {
  incomeForecast: number;
  items: PlanItem[];
}

export type GoalType = "MONETARY" | "NUMERIC";

export interface GoalHistory {
  id: string;
  date: string;
  amount: number;
  note?: string;
  protocol?: EvolutionProtocol;
}

export interface Goal {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  color?: string;
  type: GoalType;
  unit?: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  history?: GoalHistory[];
  items?: GoalItem[];
  useChecklist?: boolean;
}

export interface CreateGoalDTO {
  title: string;
  targetValue: number;
  deadline: string;
  category?: string;
  icon?: string;
  color?: string;
  type: GoalType;
  useChecklist?: boolean;
}

export interface GoalDepositDTO {
  accountId?: string;
  amount: number;
  note?: string;
}

export type GoalItemStatus = "PENDING" | "PURCHASED";

export interface GoalItem {
  id: string;
  name: string;
  suggestedModel?: string;
  estimatedPrice: number;
  paidPrice?: number;
  status: GoalItemStatus;
  orderIndex: number;
  usedGoalBalance: boolean;
}

export interface CreateGoalItemDTO {
  name: string;
  suggestedModel?: string;
  estimatedPrice: number;
}

export interface PurchaseGoalItemDTO {
  paidPrice: number;
  accountId?: string;
  cardId?: string;
  installments?: number;
}

export type InvestType =
  | "STOCK"
  | "FII"
  | "FIXED_INCOME"
  | "CRYPTO"
  | "TREASURY"
  | "OTHER";
export type InvestTransType = "BUY" | "SELL" | "DIVIDEND" | "INTEREST";

export interface InvestTransaction {
  id: string;
  type: InvestTransType;
  date: string;
  quantity: number;
  price: number;
  totalValue: number;
  fees: number;
}

export interface Investment {
  id: string;
  ticker: string;
  name: string;
  type: InvestType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  goalId?: string;
  goal?: Goal;
}

export interface CreateInvestmentDTO {
  ticker: string;
  name: string;
  type: InvestType;
  goalId?: string;
}

export interface InvestmentOperationDTO {
  investmentId: string;
  type: InvestTransType;
  quantity: number;
  price: number;
  fees?: number;
  date: string;
  accountId: string;
}

export interface UpdateBalanceDTO {
  investmentId: string;
  newBalance: number;
}

export interface YearlyComparison {
  incomeGrowthPercentage: number;
  expenseGrowthPercentage: number;
  message: string;
}

export interface InvestmentBreakdown {
  name: string;
  value: number;
  type: "GOAL" | "ASSET";
  color: string;
}

export interface AnnualSummaryResponse {
  year: number;
  balance: {
    totalIncome: number;
    totalExpense: number;
    annualBalance: number;
  };
  creditCard: {
    totalSpent: number;
    subscriptionsTotal: number;
    monthlyAverage: number;
  };
  investments: {
    totalValue: number;
    items: InvestmentBreakdown[];
  };
  comparison: YearlyComparison;
  note: string;
}

export type HabitStatus = "PENDING" | "COMPLETED" | "SKIPPED" | "FAILED";

export interface HabitLog {
  id: string;
  date: string;
  status: HabitStatus;
}

export type HabitFrequency = "DAILY" | "WEEKLY_GOAL";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  weeklyGoal?: number;
  currentStreak: number;
  highestStreak: number;
  orderIndex: number;
  logs: HabitLog[];
  createdAt: string;
  goalId?: string;
}

export interface CreateHabitDTO {
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  weeklyGoal?: number;
  goalId?: string;
}

export interface EvolutionProtocol {
  bookTitle?: string;
  author?: string;
  rating?: number;
  essence?: string;
  personalConnection?: string;
  systemEngineering?: string;
}
