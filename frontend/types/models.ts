export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
}

export type Occupation = "Student" | "Salaried" | "Self-employed" | "Business owner";
export type SpendingStyle = "Careful" | "Balanced" | "Impulsive";
export type OverspendArea =
  | "Food"
  | "Shopping"
  | "Entertainment"
  | "Transport"
  | "Don't know";

export interface Transaction {
  _id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface CreateTransactionInput {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface OnboardingInput {
  name: string;
  age: number;
  occupation: Occupation;
  dependents: number;
  monthlyIncome: number;
  fixedCommitments: number;
  currency: string;
  spendingStyle: SpendingStyle;
  hasMonthlyBudget: boolean;
  monthlyBudget?: number;
  overspendArea: OverspendArea;
}

export interface OnboardingProfile extends OnboardingInput {
  userId: string;
  createdAt: string;
  updatedAt: string;
}
