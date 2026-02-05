
export interface CartItem {
  id: string;
  name: string;
  mrp: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

export const cartState: CartState = {
  items: [],
};
