export interface Food {
  id: string;
  name: string;
}

export interface ParseFoodResponse {
  foods: Food[];
}
