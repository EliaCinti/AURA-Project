export enum ExpenseType {
  SUBSCRIPTION = 'Abbonamento',
  ONE_TIME = 'Una Tantum',
  RECURRING_BILL = 'Bolletta/Ricorrente'
}

export enum Frequency {
  MONTHLY = 'Mensile',
  YEARLY = 'Annuale',
  WEEKLY = 'Settimanale',
  ONCE = 'Singola'
}

export enum Category {
  ENTERTAINMENT = 'Intrattenimento',
  AI_TOOLS = 'Software AI',
  UTILITIES = 'Utenze',
  FOOD = 'Cibo & Spesa',
  TRANSPORT = 'Trasporti',
  SHOPPING = 'Shopping',
  HEALTH = 'Salute',
  EDUCATION = 'Formazione',
  WORK = 'Lavoro',
  OTHER = 'Altro'
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  type: ExpenseType;
  frequency: Frequency;
  categories: Category[]; // Changed from single category to array
  dateAdded: string;
}
