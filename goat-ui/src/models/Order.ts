export interface Order {
    contractID: number;
    price: number;
    itemName: string;
    description: string;
    interestRate: any;
    status: string;
    startDate: number;
    pawnerShippingHash: string;
    ownerShippingHash: string;
}