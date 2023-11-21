// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @notice Helper contract to update swap data on-chain
 */
contract SwapHelpers {
    using SafeERC20 for IERC20;

    uint256 public constant VERSION = 2;
    IERC20 private constant _ETH = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    error IncorrectValue(uint256 expected, uint256 actual);
    error TransferFailed(address receiver);

    function swap(
        address primary,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 amountIn,
        address receiver,
        bytes memory data,        
        uint256 index
    ) external payable returns (bytes memory) {
        if (index != type(uint256).max) insertAmount(data, index, amountIn);
        if (tokenIn == _ETH) {
            if (msg.value != amountIn) revert IncorrectValue(amountIn, msg.value);
        } else {
            if (msg.value != 0) revert IncorrectValue(0, msg.value);
            tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
            if (tokenIn.allowance(address(this), primary) != 0) {
                // Reset approval just in case
                tokenIn.approve(primary, 0);
            }
            tokenIn.approve(primary, amountIn);
        }
        (bool success, bytes memory response) = primary.call{ value: msg.value }(data);
        if (!success) {
            assembly {
                revert(add(response, 0x20), mload(response))
            }
        }
        if (tokenOut == _ETH) {
            (success, ) = receiver.call{ value: address(this).balance }('0x');
            if (!success) revert TransferFailed(receiver);
        } else {
            tokenOut.safeTransfer(receiver, tokenOut.balanceOf(address(this)));
        }
        return response;
    }

    function insertAmount(
        bytes memory data,
        uint256 index,
        uint256 amount
    ) public pure returns (bytes memory) {
        assembly {
            mstore(add(data, add(36, mul(index, 32))), amount)
        }
        return data;
    }

    receive() external payable {}
}
