import { ethers } from "hardhat";
import { expect } from "chai";

//@Author: Alex Nasca
//@Author: Trevor Radomski 
//@Author: Nick Geigel

describe("BusinessContract", function () {
  async function deployBusinessContractFixture() {
    const [owner, pawner] = await ethers.getSigners();

    const businessContract = await ethers.deployContract("BusinessContract");
    await owner.sendTransaction({
      to: businessContract.getAddress(),
      value: ethers.parseEther("15"),
    });

    return { businessContract, owner, pawner };
  }

  it("create order", async function () {
    // Test case to create an order and verify its details
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();

    const orderNum = await businessContract.createOrder(
      "1",
      "car",
      "its a car",
      "SILVER"
    );
    const order = await businessContract.getOrder(1);
    //ensure details for the pending order are stored and can be retrieved
    expect(order[1]).to.equal(ethers.parseEther("1"));
    expect(order[2]).to.equal("car");
    expect(order[3]).to.equal("its a car");
    expect(order[4]).to.equal("SILVER");
    expect(order[5]).to.equal("PENDING");
    //start date is 0
    expect(order[6]).to.equal(0n);
  });

  it("accept order and get sub contract info", async function () {
    // Test case to accept an order and verify the sub contract details
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();

    await businessContract.createOrder(1, "car", "its a car", "SILVER");
    await businessContract.acceptOrder(1);

    /*
      At the point since the order has been Accepted a subcontract is deployed by the business contract. 
      It starts with the same details but the subcontract will be the only one updated from this point on.
      It stores all the transaction information specific to this order and makes all calculations for interest.
    */
    const order = await businessContract.getOrder(1);

    //Once the admin accepts the order, the Parent contract status for this order should be ACCEPTED
    expect(order[5]).to.equal("ACCEPTED");
    // get subcontract details and ensure they are the same as the order details in the Parent Contract 
    const subcontractOrder = await businessContract.getSubContractOrder(1);
    console.log("getSubContractOrder output:\n" + subcontractOrder);
    expect(subcontractOrder[0]).to.equal(order[0]);
    expect(subcontractOrder[1].toString()).to.equal(order[1]);
    expect(subcontractOrder[2]).to.equal(order[2]);
    expect(subcontractOrder[3]).to.equal(order[3]);
    expect(subcontractOrder[4]).to.equal(order[4]);
    expect(subcontractOrder[5]).to.equal(order[5]);
    expect(subcontractOrder[6]).to.equal(order[6]);

    const vars = await businessContract.getSubContractVars(1);
    console.log("getSubContractVars output\n" + vars);
    // check order price
    expect(vars[0]).to.equal(ethers.parseEther('1'));
    //check pawner stake amount
    expect(vars[1]).to.equal(ethers.parseEther('1'));
    //check owner stake amount
    expect(vars[2]).to.equal(ethers.parseEther('2'));
    //check interest rate (this is a percentage but must be stored as a whole number)
    expect(vars[3]).to.equal(15n);
  });

  it("test pawner Stakes", async function () {
    // Test case to test pawner stakes and verify the balances
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();
    await businessContract.createOrder(
      "1",
      "car",
      "its a car",
      "SILVER"
    );
    await businessContract.acceptOrder(1);
    const subContractOrder1 = await businessContract.getSubContractOrder(1);
    const subcontractAddress = await businessContract.getSubContractAddress(1);
    console.log(subContractOrder1[5]);
    expect(subContractOrder1[5]).to.equal("ACCEPTED");
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: ethers.parseEther("1"),
    });
    const subContractOrder2 = await businessContract.getSubContractOrder(1);
    console.log(subContractOrder2[5]);
    //Subcontract status is now STAKED after pawner stakes
    expect(subContractOrder2[5]).to.equal("STAKED");
    //should be 10000 - 1 (stake) = 9999
    expect(
      parseFloat(
        await ethers.formatEther(await ethers.provider.getBalance(pawner))
      ).toFixed(2)
    ).to.equal("9999.00");

    const contractAddress = await businessContract.getAddress();
    // tests that company stakes double the cost automatically (1 eth cost = 2 eth stake) 15-2 = 13
    expect(await ethers.provider.getBalance(contractAddress)).to.equal(
      ethers.parseEther("13")
    );
  });

  it("test pawner submits shipping number", async function () {
    // Test case to test owner submitting shipping number and verify the hash values
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();

    await businessContract.createOrder(1, "car", "its a car", "SILVER");
    await businessContract.acceptOrder(1);
    const order = await businessContract.getOrder(1);
    //check before and after client and owner submit shipping number
    expect(order[7]).to.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(order[8]).to.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );

    //pawner must stake before submitting shipping number
    const subcontractAddress = await businessContract.getSubContractAddress(1);
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: ethers.parseEther("1"),
    });

    // now pawner can submit shipping number
    await businessContract.assignPawnerShippingHash(1, 1234);
    const order_after = await businessContract.getOrder(1);

    //not a direct hash from 1234 to bytes because it abi encodes it first
    expect(order_after[7]).to.equal(
      "0xea05319122ecf34a553669191848370ff785fe00ee6f01d3d9a8e4be7eee5249"
    );
  });

  it("Test stake taken out early", async function () {
    // Test case to test stake taken out early and verify the balances
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();
    await businessContract.createOrder(
      "1",
      "car",
      "its a car",
      "SILVER"
    );
    await businessContract.acceptOrder(1);
    const subcontractAddress = await businessContract.getSubContractAddress(1);
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: ethers.parseEther("1"),
    });
    await businessContract.ownerWithdrawStakeEarly(1);
    const subContractOrder = await businessContract.getSubContractOrder(1);
    //check that the order status is payed
    expect(subContractOrder[5]).to.equal("EXPIRED");
    expect(await ethers.provider.getBalance(subcontractAddress)).to.equal(0n);
    expect(
      ethers.formatEther(
        await ethers.provider.getBalance(businessContract.getAddress())
      )
    ).to.equal("15.0");
  });

  it("test money locks after shipping number is submitted", async function () {
    // Test case to test money locks after shipping number is submitted and verify the error message
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();
    await businessContract.createOrder(
      "1",
      "car",
      "its a car",
      "SILVER"
    );
    await businessContract.acceptOrder(1);
    const subcontractAddress = await businessContract.getSubContractAddress(1);
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: ethers.parseEther("1"),
    });
    await businessContract.assignPawnerShippingHash(1, 1234);

    expect(businessContract.ownerWithdrawStakeEarly(1)).to.be.revertedWith(
      "Pawner has shipped, stakes are locked"
    );
  });

  it("test pawner pays back (perfect scenario)", async function () {
    // Test case to test pawner pays back and verify the balances
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();
    await businessContract.createOrder(
      "1",
      "car",
      "its a car",
      "SILVER"
    );
    await businessContract.acceptOrder(1);
    const subcontractAddress = await businessContract.getSubContractAddress(1);
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: ethers.parseEther("1"),
    });
    expect(
      await ethers.formatEther(
        await ethers.provider.getBalance(subcontractAddress)
      )
    ).to.equal("3.0");
    //Give back shipping stake to pawner
    await businessContract.ownerConfirmShipping(1);

    expect(
      await ethers.formatEther(
        await ethers.provider.getBalance(subcontractAddress)
      )
    ).to.equal("2.0");

    // check amount owed which is a requirement to pay back (sets a necessary variable)
    let amountOwed = await businessContract.checkRepayAmount(1); //equals 1.000000744047619047
    console.log("Amount Owed: " + amountOwed); //unofficial method to print

    // 1.000000744047619047 ETH accounting for interest
    
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: "1000000744047619047",
    });

    //check to ensure that the contract is at 1.000000744047619047
    //should be equal to owner stake + amount payed by pawner
    expect(
      await ethers.formatEther(
        await ethers.provider.getBalance(subcontractAddress)
      )
    ).to.equal("3.000000744047619047");
    const subContractVars = await businessContract.getSubContractVars(1);
    //can see how much is owed to owner based on interest rate (official method)
    console.log(
      "Amount Owed to Owner: " + ethers.formatEther(subContractVars[7])
    );

    const subContractOrder = await businessContract.getSubContractOrder(1);
    //check that the order status is payed
    expect(subContractOrder[5]).to.equal("PAYED");

    await businessContract.assignOwnerShippingHash(1, 4321);
  
    let order_after = await businessContract.getOrder(1);
    //check that the Owner shipping hash is stored
    expect(order_after[8]).to.equal(
      "0x626b1d519825bf661d804eedbb1a31b9ba072f6e77358478fd6e15e3423c38b9"
    );
  

    //final step
    await businessContract.pawnerConfirmShipping(1);
    //check that the order status is COMPLETED
    const subContractOrder2 = await businessContract.getSubContractOrder(1);
    //check that the order status is payed
    expect(subContractOrder2[5]).to.equal("COMPLETED");
    //check that the pawner has 10000 - 1.000000744047619047 rounded to 4 (take into account gas fees and its a bit more)
    expect(
      parseFloat(
        await ethers.formatEther(await ethers.provider.getBalance(pawner))
      ).toFixed(3)
    ).to.equal("9996.999");
    //account for interest 15 (initial) + .000000744047619047 (interest) = 15.000000744047619047
    expect(
      await ethers.formatEther(
        await ethers.provider.getBalance(businessContract)
      )
    ).to.equal("15.000000744047619047");

    //check that subcontract balance is now zero
    expect(await ethers.provider.getBalance(subcontractAddress)).to.equal(0n);
  });

  it("test loan expires", async function () {
    // Test case to test loan expiration and verify the expire date
    const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();
    await businessContract.createOrder(
      "1",
      "car",
      "its a car",
      "SILVER"
    );
    await businessContract.acceptOrder(1);
    const subcontractAddress = await businessContract.getSubContractAddress(1);
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: ethers.parseEther("1"),
    });

    await businessContract.ownerConfirmShipping(1);

    // 1.000000744047619047 ETH accounting for interest
    
    await pawner.sendTransaction({
      to: subcontractAddress,
      value: "1000000744047619047",
    });

    const subContractVars = await businessContract.getSubContractVars(1);
    //check that the loan length is one week in seconds
    expect(subContractVars[4]).to.equal(604800);
    
    console.log("Loan Length: " + subContractVars[4]);
    console.log("Start Date: " + subContractVars[5]);
    console.log("Expire Date: " + subContractVars[6]);

    //expire date should equal start date + loan length
    expect(subContractVars[6]).to.equal(
      subContractVars[4] + subContractVars[5]
    );
  });

    it("test delete contract", async function () {
      // Test case to test deleting a contract after it expires and verify the balances
      const { businessContract, owner, pawner } =
      await deployBusinessContractFixture();
      await businessContract.createOrder(
        "1",
        "car",
        "its a car",
        "SILVER"
      );
      await businessContract.acceptOrder(1);
      const subcontractAddress = await businessContract.getSubContractAddress(1);
      await expect(businessContract.deleteOrder(1)).to.be.revertedWith(
        "Order has not been STAKED"
      );
      await pawner.sendTransaction({
        to: subcontractAddress,
        value: ethers.parseEther("1"),
      });

      await businessContract.deleteOrder(1);
      //check that the subcontract balance is now zero (all funds are returned to the respective owner)
      expect (await ethers.provider.getBalance(subcontractAddress)).to.equal(0n);
      //check that the business contract balance is now 15 (the original amount)
      expect (await ethers.formatEther(await ethers.provider.getBalance(businessContract))).to.equal('15.0');
      await businessContract.createOrder(
        "1",
        "car",
        "its a car",
        "SILVER"
      );

      await businessContract.acceptOrder(2);
      //we still store the old contract for book keeping purposes and new contracts can be appended 
      expect (await businessContract.getSubContractAddress(2)).to.not.equal('0x0000000000000000000000000000000000000000');

    });
});
