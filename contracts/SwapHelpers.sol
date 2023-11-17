// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/**
 * @notice Helper contract to update swap data on-chain
 */
contract SwapHelpers {
    uint256 public constant VERSION = 1;

    function insertAmount(
        bytes memory data,
        uint256 index,
        uint256 amount
    ) external pure returns (bytes memory) {
        assembly {
            mstore(add(data, add(36, mul(index, 32))), amount)
        }
        return data;
    }
}
