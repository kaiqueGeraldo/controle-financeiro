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
  cashAmount?: number;
  cashDelta?: number | null;
  date: string;
  createdAt: string;
  time?: string | null;
  timeOrigin?: "USER_INPUT" | "NOT_PROVIDED" | "UNKNOWN";
  recordedAt?: string | null;
  legacyCreatedAtRaw?: string | null;
  isPaid: boolean;
  type: TransactionType;
  accountId: string;
  categoryId?: string;
  categoryName?: string;
  accountName?: string;
  category?: Category;
  account?: Account;
  isSystemManaged?: boolean;
  status?: "PENDING" | "PARTIALLY_SETTLED" | "FULFILLED" | "CANCELLED" | "SETTLED" | "REVERSED";
  origin?: string;
  operationId?: string | null;
  transferDirection?: "OUTBOUND" | "INBOUND" | null;
  dueDate?: string | null;
  settlementOfId?: string | null;
  realizationOfId?: string | null;
  reversalOfId?: string | null;
  reason?: string | null;
  settledAmount?: number;
  reversedAmount?: number;
  remainingAmount?: number;
}

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
}

export interface CreateTransactionDTO {
  description: string;
  amount: number | string;
  date: string;
  time?: string | null;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  isPaid: boolean;
  destinationAccountId?: string;
  fee?: string;
}

export interface AccountPosition {
  asOfDate:string;totalBalance:string;checkingBalance:string;archivedBalance:string;
  outsideSupportedRange:boolean;accounts:Account[];
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

export interface UpdatePlanItemDTO {
  description?: string;
  amount?: number;
  dueDate?: string;
  categoryId?: string | null;
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
  protocol?: EvolutionProtocol;
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
  allocationId?: string;
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
  date: string | null;
  dateOrigin?: "USER_INPUT" | "PRODUCT_CALENDAR" | "UNKNOWN";
  legacyDateRaw?: string | null;
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
    totalCost?: number | null;
    valuationAmount?: number | null;
    valuationDate?: string | null;
    valuationSource?: string | null;
    valuationBasis?: "TOTAL" | "PRICE" | null;
  goalId?: string;
  goal?: Goal;
}

export interface CreateInvestmentDTO {
  ticker: string;
  name: string;
  type: InvestType;
  goalId?: string;
  openingQuantity?:string;
  openingCost?:string;
  openingValue?:string;
  valuationDate?:string;
  valuationSource?:string;
}

export interface InvestmentOperationDTO {
  amount?: string;
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
  date: string;
  source: string;
  reason: string;
}

export interface YearlyComparison {
  incomeGrowthPercentage: number | null;
  expenseGrowthPercentage: number | null;
  message: string;
}

export interface InvestmentBreakdown {
    name: string;
    value: number | null;
  type: "GOAL" | "ASSET";
  color: string;
  valuationDate?:string|null;
  valuationSource?:string|null;
}

export interface AnnualSummaryResponse {
  year: number;
    balance: {
      totalIncome: number | null;
      totalExpense: number | null;
      annualBalance: number | null;
      investmentResult?: number | null;
      coverage?:ReportingCoverage; observed?:ObservedTotals;
  };
  creditCard: {
    totalSpent: number | null;
    subscriptionsTotal: number | null;
    monthlyAverage: number | null;
    coverage?:ReportingCoverage; observed?:{totalSpent:string;subscriptionsTotal:string;monthlyAverage:string};
  };
    investments: {
      totalCost?: number | null;
      totalValue: number | null;
      valuationAsOf?: string | null;
      valuationComplete?: boolean;
      outsideSupportedRange?: boolean;
      observedCost?: string|null;
      observedValue?: string|null;
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

export interface ReportingCoverage {
 state: "COMPLETE"|"PARTIAL"|"UNAVAILABLE"|"UNKNOWN_ORIGIN"|"OUT_OF_RANGE";
 requestedFrom: string; requestedThrough: string; knownFrom: string|null; knownThrough: string;
 unknownSources: number; reason: string;
}
export interface ObservedTotals {income:string;expense:string;balance:string|null;investmentResult:string|null;cardConsumption:string}
export interface MonthlyFlowResponse {income:number|null;expense:number|null;balance:number|null;percentage:number|null;investmentResult?:number|null;coverage?:ReportingCoverage;observed?:ObservedTotals}
export interface ChartPoint {label:string;valor:number|null;observedValue?:string;coverage?:ReportingCoverage}
export interface CashSummaryResponse {entries:number|null;exits:number|null;balance:number|null;coverage?:ReportingCoverage;observed?:{entries:string;exits:string;balance:string}}
