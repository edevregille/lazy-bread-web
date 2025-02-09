
export interface Product {
    id: string;
    name: string;
    description?: string;
    image?: string;
    unitCost: number;
}

export interface CartItem {
    product: Product,
    qty: number,
}
