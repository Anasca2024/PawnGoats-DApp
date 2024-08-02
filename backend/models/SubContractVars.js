class SubContractVars {
    constructor(SubContractVarsData) {
        this.price = SubContractVarsData[0].toString();
        this.pawnerStake = SubContractVarsData[1].toString();
        this.ownerStake = SubContractVarsData[2].toString();
        this.interest = SubContractVarsData[3].toString();
        this.loanLength = SubContractVarsData[4].toString();
        this.startDate = SubContractVarsData[5].toString();
        this.expireDate = SubContractVarsData[6].toString();
        this.repayAmount = SubContractVarsData[7].toString();
    }
}

module.exports = SubContractVars;