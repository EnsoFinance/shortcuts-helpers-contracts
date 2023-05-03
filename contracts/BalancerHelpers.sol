pragma solidity ^0.8.16;
contract BalancerHelpers {

    uint256 public constant VERSION = 1;

    function encodeExactTokensJoin(uint256[] memory amounts, uint256 minimumBPT)
        public 
        pure
        returns (bytes memory)
    {
        uint256 joinKind = 1; // EXACT TOKENS JOIN
        return abi.encode(joinKind, amounts, minimumBPT);
    }
}
