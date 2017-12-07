pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/StandardToken.sol";


contract TestToken is StandardToken {
    function TestToken(address[] _accounts, uint256 _initialBalance) public {
        for (uint256 i = 0; i < _accounts.length; i++) {
            balances[_accounts[i]] = _initialBalance;
            totalSupply += _initialBalance;
        }
    }
}
