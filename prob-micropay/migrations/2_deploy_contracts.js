const ECRecovery = artifacts.require("ECRecovery")
const SafeMath = artifacts.require("SafeMath")
const TicketBroker = artifacts.require("TicketBroker")

module.exports = function(deployer) {
    deployer.deploy(ECRecovery)
    deployer.link(ECRecovery, TicketBroker)

    deployer.deploy(SafeMath)
    deployer.link(SafeMath, TicketBroker)
};
