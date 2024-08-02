class Order {
    constructor(orderData) {
        this.contractID = orderData[0].toNumber();
        this.price = orderData[1].toString();
        this.itemName = orderData[2];
        this.description = orderData[3];
        this.interestRate = orderData[4];
        this.status = orderData[5];
        this.startDate = orderData[6].toNumber();
        this.pawnerShippingHash = orderData[7];
        this.ownerShippingHash = orderData[8];
    }
}

module.exports = Order;
