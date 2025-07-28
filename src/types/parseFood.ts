export interface ParsedFood {
  id: string;
  name: string;
}

export interface ParseFoodResponse {
  foods: ParsedFood[];
}
