// SPDX-License-Identifier: MIT
//@Author: Alex Nasca
//@Author: Trevor Radomski
//@Author: Nick Geigel
pragma solidity ^0.8.0;

library SharedStructs {
    struct pawnOrder {
        uint256 contractID;
        uint256 Price;
        string itemName;
        string Description;
        string interestRate;
        string status;
        uint256 startDate;
        bytes32 pawnerShippingHash;
        bytes32 ownerShippingHash;
    }
}
/**
 * @title BusinessContract
 * @dev This contract manages the business logic for creating and managing pawn orders.
 */
contract BusinessContract {
    uint256 pawnOrderID;
    uint256 repayAmount;
    //to track all orders
    mapping(uint256 => SharedStructs.pawnOrder) public Orders;
    mapping(uint256 => TransactionContract) public subContracts;
    mapping(uint256 => SharedStructs.pawnOrder) public allOrders;

    event OrderCreated(uint256 orderNum);
    event LoanRepayAmount(uint256 repayAmount);
    event AllOrders(SharedStructs.pawnOrder[] allOrders);

    /**
     * @dev Fallback function to receive payments.
     */
    receive() external payable {}

    /**
     * @dev Creates a new pawn order.
     * @param _Price The price of the item in ether.
     * @param _itemName The name of the item.
     * @param _Description The description of the item.
     * @param _interestRate The interest rate for the loan.
     * @return The ID of the created pawn order.
     */
    function createOrder(
        uint256 _Price,
        string memory _itemName,
        string memory _Description,
        string memory _interestRate
    ) public returns (uint256) {
        pawnOrderID++;
        Orders[pawnOrderID] = SharedStructs.pawnOrder(
            pawnOrderID,
            _Price * 1 ether,
            _itemName,
            _Description,
            _interestRate,
            "PENDING",
            0,
            bytes32(0x0),
            bytes32(0x0)
        );

        emit OrderCreated(pawnOrderID);

        return pawnOrderID;
    }

    /**
     * @dev Accepts a pawn order and deploys a sub contract for the order.
     * @param _orderID The ID of the pawn order to accept.
     */
    function acceptOrder(uint256 _orderID) public {
        Orders[_orderID].status = "ACCEPTED";
        Orders[_orderID].startDate = block.timestamp;

        //deploy sub contract using new keyword
        uint256 ownerStakeAmount = Orders[_orderID].Price * 2;
        TransactionContract subContract = new TransactionContract(
            1 ether,
            ownerStakeAmount,
            Orders[_orderID]
        );
        subContracts[_orderID] = subContract;
    }

    /** @dev If pawner clicks the I did not stake button the contract will send back all funds and the order will be deleted
     * @param _orderID The ID of the pawn order to delete.
     */

    function deleteOrder(uint256 _orderID) public {
        TransactionContract(subContracts[_orderID]).deleteOrder();
    }

    /** @dev allows pawn shop to withdraw stake if the pawner has not shipped the item yet
     * @param _orderID The ID of the pawn order to withdraw stake from.
     */
    function ownerWithdrawStakeEarly(uint256 _orderID) public {
        TransactionContract(subContracts[_orderID]).sendStakeBackEarly();
    }

    /**
     * @dev Creates a shipping hash for a given shipping number.
     * @param _shippingNumber The shipping number.
     * @return The shipping hash.
     */
    function createShippingHash(
        uint256 _shippingNumber
    ) private pure returns (bytes32) {
        return sha256(abi.encodePacked(_shippingNumber));
    }

    /**
     * @dev Assigns the pawner's shipping hash for a pawn order.
     * @param _orderID The ID of the pawn order.
     * @param _shippingNumber The shipping number.
     */
    function assignPawnerShippingHash(
        uint256 _orderID,
        uint256 _shippingNumber
    ) public {
        bytes32 _shippingHash = createShippingHash(_shippingNumber);
        Orders[_orderID].pawnerShippingHash = _shippingHash;
        subContracts[_orderID].setPawnerShippingHash(_shippingHash);
    }

    /**
     * @dev Assigns the owner's shipping hash for a pawn order.
     * @param _orderID The ID of the pawn order.
     * @param _shippingNumber The shipping number.
     */
    function assignOwnerShippingHash(
        uint256 _orderID,
        uint256 _shippingNumber
    ) public {
        bytes32 _shippingHash = createShippingHash(_shippingNumber);
        Orders[_orderID].ownerShippingHash = _shippingHash;
        subContracts[_orderID].setOwnerShippingHash(_shippingHash);
    }

    /**
     * @dev Confirms the shipping by the owner for a pawn order.
     * @param _orderID The ID of the pawn order.
     */
    function ownerConfirmShipping(uint256 _orderID) public {
        // need address of the subcontract
        TransactionContract(subContracts[_orderID]).pawnerCompletedShipping();
    }

    /**
     * @dev Confirms the shipping by the pawner for a pawn order.
     * @param _orderID The ID of the pawn order.
     */
    function pawnerConfirmShipping(uint256 _orderID) public {
        // need address of the subcontract
        TransactionContract(subContracts[_orderID]).ownerCompletedShipping();
    }

    /**
     * @dev iterates through and Expires a pawn order.
     */

    /**
     * @dev Gets the details of a pawn order.
     * @param _orderID The ID of the pawn order.
     * @return The pawn order details.
     */
    function getOrder(
        uint256 _orderID
    ) public view returns (SharedStructs.pawnOrder memory) {
        return Orders[_orderID];
    }

    /**
     * @dev Gets the address of the sub contract for a pawn order.
     * @param _orderID The ID of the pawn order.
     * @return The address of the sub contract.
     */
    function getSubContractAddress(
        uint256 _orderID
    ) public view returns (address) {
        return address(subContracts[_orderID]);
    }

    /**
     * @dev Gets the pawn order details from the sub contract.
     * @param _orderID The ID of the pawn order.
     * @return The pawn order details.
     */
    function getSubContractOrder(
        uint256 _orderID
    ) public view returns (SharedStructs.pawnOrder memory) {
        TransactionContract subContract = subContracts[_orderID];
        SharedStructs.pawnOrder memory order = subContract.getOrder();
        return order;
    }

    /**
     * @dev Checks the loan amount for a pawn order.
     * @param _orderID The ID of the pawn order.
     * @return The loan amount.
     */
    function checkRepayAmount(uint256 _orderID) public returns (uint256) {
        TransactionContract subContract = subContracts[_orderID];
        SharedStructs.pawnOrder memory orderValues = subContract.getOrder();
        require(
            keccak256(abi.encodePacked(orderValues.status)) ==
                keccak256(abi.encodePacked("INPROGRESS")),
            "Can't check loan amount yet, or contract expired"
        );

        subContract.getLoanAmount();
        repayAmount = subContract.getRepayAmount();

        emit LoanRepayAmount(repayAmount);

        return repayAmount;
    }

    /**
     * @dev Gets the variables from the sub contract for a pawn order.
     * @param _orderID The ID of the pawn order.
     * @return An array of variables.
     */
    function getSubContractVars(
        uint256 _orderID
    ) public view returns (uint256[] memory) {
        TransactionContract subContract = subContracts[_orderID];
        SharedStructs.pawnOrder memory order = subContract.getOrder();
        uint256 pawnerStake = subContract.getPawnerStakeAmount();
        uint256 ownerStake = subContract.getOwnerStakeAmount();
        uint256 interest = subContract.getInterest();
        uint256 loanLength = subContract.getLoanLength();
        uint256 startDate = order.startDate;
        uint256 expireDate = order.startDate + loanLength;
        uint256 repayAmount = subContract.getRepayAmount();

        // Combine into a single array
        uint256[] memory combinedArray = new uint256[](8);
        combinedArray[0] = order.Price;
        combinedArray[1] = pawnerStake;
        combinedArray[2] = ownerStake;
        combinedArray[3] = interest;
        combinedArray[4] = loanLength;
        combinedArray[5] = startDate;
        combinedArray[6] = expireDate;
        combinedArray[7] = repayAmount;

        return combinedArray;
    }

    /**
     * @dev Pays the owner of the sub contract.
     * @param _amount The amount to pay.
     * @param contractID The ID of the sub contract.
     */
    function ownerPay(uint256 _amount, uint contractID) public {
        address subContractAddress = getSubContractAddress(contractID);
        (bool success, ) = payable(subContractAddress).call{value: _amount}("");
        require(success, "Transfer failed");
    }

    function getAllOrders() public returns (SharedStructs.pawnOrder[] memory) {
        // Add all orders to the allOrders mapping
        for (uint256 i = 1; i <= pawnOrderID; i++) {
            allOrders[i] = Orders[i];
        }
        // Get all orders from subContracts map
        // Allow them to overwrite their old entry if they have a subcontract
        for (uint256 i = 1; i <= pawnOrderID; i++) {
            if (address(subContracts[i]) != address(0)) {
                SharedStructs.pawnOrder memory order = subContracts[i]
                    .getOrder();
                allOrders[order.contractID] = order;
            }
        }
        // Check if any orders that are in Orders are not in subContracts

        // Convert the mapping into a list of orders
        SharedStructs.pawnOrder[]
            memory allOrdersList = new SharedStructs.pawnOrder[](pawnOrderID);
        for (uint256 i = 1; i <= pawnOrderID; i++) {
            allOrdersList[i - 1] = allOrders[i];
        }
        // Return the list via event emit
        emit AllOrders(allOrdersList);
        // Return the list/set
        return allOrdersList;
    }
}
/**
 * @title TransactionContract
 * @dev A contract that facilitates transactions between a pawner and a company.
 */
contract TransactionContract {
    address public owner;
    address public pawner;
    uint256 pawnerStakeAmount;
    uint256 companyStakeAmount;
    uint256 interest;
    uint256 pawnerPayedAmount;
    uint256 loanLength;
    uint256 expireDate;
    uint256 timeSinceStart;
    uint256 timeOfPayment;
    uint256 repayAmount;
    uint256 timeToPay;
    SharedStructs.pawnOrder order;

    /**
     * @dev Constructor function that initializes the TransactionContract.
     * @param _pawnerStakeAmount The amount of stake required from the pawner.
     * @param _companyStakeAmount The amount of stake required from the company.
     * @param _order The pawn order details.
     */
    constructor(
        uint256 _pawnerStakeAmount,
        uint256 _companyStakeAmount,
        SharedStructs.pawnOrder memory _order
    ) {
        // Initialize contract variables
        pawnerStakeAmount = _pawnerStakeAmount;
        companyStakeAmount = _companyStakeAmount;
        order = _order;
        owner = msg.sender;

        // Set interest and loan length based on the interest rate in the order
        if (
            keccak256(bytes(order.interestRate)) == keccak256(bytes("SILVER"))
        ) {
            interest = 15;
            loanLength = 7 days;
        } else if (
            keccak256(bytes(order.interestRate)) == keccak256(bytes("GOLD"))
        ) {
            interest = 25;
            loanLength = 14 days;
        } else if (
            keccak256(bytes(order.interestRate)) == keccak256(bytes("PLATINUM"))
        ) {
            interest = 35;
            loanLength = 21 days;
        }
    }

    /**
     *  @dev If pawner clicks the I did not stake button the contract will send back all funds and the order will be deleted
     */

    function deleteOrder() public {
        require(msg.sender == owner, "You are not the owner");
        require(
            keccak256(bytes(order.status)) == keccak256(bytes("STAKED")),
            "Order has not been STAKED"
        );
        //return stake to owner
        payable(owner).transfer(companyStakeAmount);
        //return remaining amount to pawner
        payable(pawner).transfer(pawnerPayedAmount);
        order.status = "CANCELLED";
    }

    /**
     * @dev Calculates the total amount to be repaid by the pawner.
     * @return The total amount to be repaid.
     */
    function getLoanAmount() public returns (uint256) {
        uint256 timeofClick = block.timestamp;
        //10 minutes to pay, 600 seconds
        timeToPay = timeofClick + 600;
        uint256 startTime = expireDate - loanLength;
        //calculate time elapsed since loan started and payment check
        uint256 timeElapsed = timeofClick - startTime;
        //calculate interest fraction based on time to pay back
        uint256 interestOwed = (order.Price * timeElapsed * interest) /
            (100 * loanLength);
        repayAmount = order.Price + interestOwed;
        return repayAmount;
    }

    /**
     * @dev Sends the stake back to the owner and the remaining amount to the pawner.
            only if the pawner has not shipped the item yet. Else the money is locked.
     */

    function sendStakeBackEarly() public {
        require(msg.sender == owner, "You are not the owner");
        require(
            keccak256(bytes(order.status)) == keccak256(bytes("STAKED")),
            "Order has not been staked"
        );
        require(
            order.pawnerShippingHash == bytes32(0x0),
            "Pawner has shipped, stakes are locked"
        );
        //return stake to owner
        payable(owner).transfer(companyStakeAmount);
        //return remaining amount to pawner
        payable(pawner).transfer(pawnerPayedAmount);

        order.status = "EXPIRED";
    }

    function setPawnerShippingHash(bytes32 _pawnerShippingHash) public {
        require(msg.sender == owner, "You are not the pawner");
        require(
            keccak256(bytes(order.status)) == keccak256(bytes("STAKED")),
            "Order has not been staked"
        );
        order.pawnerShippingHash = _pawnerShippingHash;
    }

    function setOwnerShippingHash(bytes32 _ownerShippingHash) public {
        require(msg.sender == owner, "You are not the owner");
        order.ownerShippingHash = _ownerShippingHash;
    }

    /**
     * @dev Fallback function that handles payments and updates the contract status.
     */
    receive() external payable {
        timeOfPayment = block.timestamp;
        expireDate = order.startDate + loanLength;

        if (
            msg.sender != owner &&
            msg.value >= pawnerStakeAmount &&
            keccak256(bytes(order.status)) == keccak256(bytes("ACCEPTED"))
        ) {
            // set the payer as pawner
            pawner = msg.sender;
            pawnerPayedAmount = msg.value;
            //create function in owner contract to pay sub contract stake
            BusinessContract(payable(owner)).ownerPay(
                companyStakeAmount,
                order.contractID
            );

            //contract change to STAKED
            order.status = "STAKED";
        } else if (timeOfPayment > expireDate) {
            //contract change to expired
            order.status = "EXPIRED";
            //return stake to owner
            payable(owner).transfer(companyStakeAmount);
            revert("Contract has expired, your item is now forfeited");
        } else if (msg.sender != owner && msg.value < pawnerStakeAmount) {
            revert("Insufficient amount");
        } else if (
            keccak256(bytes(order.status)) == keccak256(bytes("INPROGRESS")) &&
            msg.sender == pawner &&
            repayAmount != 0
        ) {
            require(msg.value >= repayAmount, "Insufficient amount");
            //contract change to completed
            order.status = "PAYED";
            pawnerPayedAmount = msg.value;
        }
    }

    /**
     * @dev Expires the order and returns the stake to the owner and remaining amount to the pawner.
     */
    function expireOrder() public {
        require(msg.sender == owner, "You are not the owner");
        if (block.timestamp > expireDate) {
            order.status = "EXPIRED";
        }
        require(
            keccak256(bytes(order.status)) == keccak256(bytes("Expired")),
            "Order has not expired, the stake is still locked"
        );
        //return stake to owner
        payable(owner).transfer(companyStakeAmount);
        //return remaining amount to pawner
        payable(pawner).transfer(pawnerPayedAmount);
    }

    /**
     * @dev Returns the total amount to be repaid by the pawner.
     * @return The total amount to be repaid.
     */
    function getRepayAmount() public view returns (uint256) {
        return repayAmount;
    }

    /**
     * @dev Returns the pawn order details.
     * @return The pawn order details.
     */
    function getOrder() public view returns (SharedStructs.pawnOrder memory) {
        return order;
    }

    /**
     * @dev Returns the amount of stake required from the pawner.
     * @return The amount of stake required from the pawner.
     */
    function getPawnerStakeAmount() public view returns (uint256) {
        return pawnerStakeAmount;
    }

    /**
     * @dev Returns the amount of stake required from the company.
     * @return The amount of stake required from the company.
     */
    function getOwnerStakeAmount() public view returns (uint256) {
        return companyStakeAmount;
    }

    /**
     * @dev Returns the interest rate.
     * @return The interest rate.
     */
    function getInterest() public view returns (uint256) {
        return interest;
    }

    /**
     * @dev Returns the loan length.
     * @return The loan length.
     */
    function getLoanLength() public view returns (uint256) {
        return loanLength;
    }

    /**
     * @dev Marks the pawner's shipping as completed and transfers the loan amount to the pawner.
     */
    function pawnerCompletedShipping() public {
        require(msg.sender == owner, "You are not the owner");
        require(
            keccak256(bytes(order.status)) == keccak256(bytes("STAKED")),
            "Order has not been staked"
        );
        //Owner adds loan to contract
        BusinessContract(payable(owner)).ownerPay(
            order.Price,
            order.contractID
        );
        //send staked amount (They may have payed more than minimum stake so we just send it back now) plus loan amount back to pawner
        payable(pawner).transfer(pawnerPayedAmount + order.Price);
        order.status = "INPROGRESS";
    }

    /**
     * @dev Marks the owner's shipping as completed and transfers the total amount owed to the owner.
     */
    function ownerCompletedShipping() public {
        require(msg.sender == owner, "You are not the owner");
        require(
            keccak256(bytes(order.status)) == keccak256(bytes("PAYED")),
            "Order is not payed yet"
        );
        order.status = "COMPLETED";
        //send staked amount plus the total amount Owed to owner
        uint256 amountToCompany = companyStakeAmount + repayAmount;
        payable(owner).transfer(amountToCompany);
        // //send remaining amount to pawner as they may have submitted more than necessary
        payable(pawner).transfer(pawnerPayedAmount - repayAmount);
    }
}
