
export interface CartItem {
  id: string;
  name: string;
  mrp: number;
  quantity: number;
  stock?: number;
}

export const cartState = {
  items: [] as CartItem[],
};
