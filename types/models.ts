export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface CreateTransactionInput {
  amount: number;
  category: string;
  type: "income" | "expense";
  userId: string;
}
