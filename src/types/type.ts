export interface ParseFoodResponse {
  foods: Food[];
}

// Food.ts
export interface Food {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  dayFoods?: DayFood[];
  orderItems?: OrderItem[];
}

// DayFood.ts
export interface DayFood {
  id: string;
  date: string; // ISO date string
  foodId: string;
  food?: Food;
}

// User.ts
export interface User {
  id: string;
  name: string;
  shortName: string;
  email?: string | null;
  avatarUrl?: string | null;
  createdAt: string; // ISO date string
  orders?: Order[];
}

// Order.ts
export interface Order {
  id: string;
  userId: string;
  createdAt: string; // ISO date string
  date: string; // ISO date string
  user?: User;
  items?: OrderItem[];
  note: string;
}

// OrderItem.ts
export interface OrderItem {
  id: string;
  orderId: string;
  foodId: string;
  food?: Food;
  order?: Order;
}

export type FoodOrder = {
  id: string;
  userShortName: string;
  userName: string;
  foodNames: string[];
  note?: string;
  date: string;
};
