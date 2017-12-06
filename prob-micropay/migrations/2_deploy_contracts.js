const ECRecovery = artifacts.require("ECRecovery")
const Math = artifacts.require("Math")
const TicketBroker = artifacts.require("TicketBroker")

module.exports = function(deployer) {
    deployer.deploy(ECRecovery)
    deployer.link(ECRecovery, TicketBroker)

    deployer.deploy(Math)
    deployer.link(Math, TicketBroker)
};
