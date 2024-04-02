// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

enum RoundingMode {
    FLOOR,
    ROUND,
    CEIL
}

interface IAssetRegistry {
    function refresh() external;
}

interface IBasketHandler {
    function quote(uint192 amount, RoundingMode rounding) external view returns (address[] memory erc20s, uint256[] memory quantities);
}

interface IMain {
    function assetRegistry() external view returns (IAssetRegistry);
    function basketHandler() external view returns (IBasketHandler);
    function frozen() external view returns (bool);
}

interface IRToken {
    function main() external view returns (IMain);
    function totalSupply() external view returns (uint256);
    function basketsNeeded() external view returns (uint256);
}

contract ReserveHelpers {
    uint64 constant FIX_SCALE = 1e18;
    uint192 constant FIX_ONE = FIX_SCALE;
    uint192 constant FIX_MAX = type(uint192).max;

    error UIntOutOfBounds();

    function maxIssuableByAmounts(IRToken rToken, uint256[] memory amounts)
        public
        returns (uint256)
    {
        IMain main = rToken.main();

        require(!main.frozen(), "frozen");

        // Poke Main
        main.assetRegistry().refresh();

        // Get basket ERC20s
        IBasketHandler bh = main.basketHandler();
        (address[] memory erc20s, uint256[] memory quantities) = bh.quote(FIX_ONE, RoundingMode.CEIL);

        // Compute how many baskets we can mint with the collateral amounts
        uint192 baskets = type(uint192).max;
        for (uint256 i = 0; i < erc20s.length; ++i) {
            // {BU} = {tok} / {tok/BU}
            uint192 inBUs = divuu(amounts[i], quantities[i]); // FLOOR
            baskets = fixMin(baskets, inBUs);
        }

        // Convert baskets to RToken
        // {qRTok} = {qRTok/BU} * {qRTok} / {BU}
        uint256 totalSupply = rToken.totalSupply();
        if (totalSupply == 0) return baskets;
        return muluDivu(baskets, rToken.totalSupply(), rToken.basketsNeeded(), RoundingMode.FLOOR);
    }

    /// Explicitly convert a uint256 to a uint192. Revert if the input is out of bounds.
    function safeWrap(uint256 x) public pure returns (uint192) {
        if (FIX_MAX < x) revert UIntOutOfBounds();
        return uint192(x);
    }

    /// Divide a uint by a uint, yielding a  uint192
    /// @return x / y
    // as-ints: x * 1e18 / y
    function divuu(uint256 x, uint256 y) public pure returns (uint192) {
        return safeWrap(mulDiv256(FIX_SCALE, x, y));
    }

    /// Compute x * y / z, avoiding intermediate overflow
    /// @dev Only use if you need to avoid overflow; costlier than x * y / z
    /// @return x * y / z
    // as-ints: x * y / z
    function muluDivu(
        uint192 x,
        uint256 y,
        uint256 z,
        RoundingMode rounding
    ) internal pure returns (uint192) {
        return safeWrap(mulDiv256(x, y, z, rounding));
    }

    /// @return min(x,y)
    // as-ints: min(x,y)
    function fixMin(uint192 x, uint192 y) public pure returns (uint192) {
        return x < y ? x : y;
    }

    /// Return (x*y/z), avoiding intermediate overflow.
    //  Adapted from sources:
    //    https://medium.com/coinmonks/4db014e080b1, https://medium.com/wicketh/afa55870a65
    //    and quite a few of the other excellent "Mathemagic" posts from https://medium.com/wicketh
    /// @dev Only use if you need to avoid overflow; costlier than x * y / z
    /// @return result x * y / z
    function mulDiv256(
        uint256 x,
        uint256 y,
        uint256 z
    ) public pure returns (uint256 result) {
        unchecked {
            (uint256 hi, uint256 lo) = fullMul(x, y);
            if (hi >= z) revert UIntOutOfBounds();
            uint256 mm = mulmod(x, y, z);
            if (mm > lo) hi -= 1;
            lo -= mm;
            uint256 pow2 = z & (0 - z);
            z /= pow2;
            lo /= pow2;
            lo += hi * ((0 - pow2) / pow2 + 1);
            uint256 r = 1;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            result = lo * r;
        }
    }

    /// Return (x*y/z), avoiding intermediate overflow.
    /// @dev Only use if you need to avoid overflow; costlier than x * y / z
    /// @return x * y / z
    function mulDiv256(
        uint256 x,
        uint256 y,
        uint256 z,
        RoundingMode rounding
    ) public pure returns (uint256) {
        uint256 result = mulDiv256(x, y, z);
        if (rounding == RoundingMode.FLOOR) return result;

        uint256 mm = mulmod(x, y, z);
        if (rounding == RoundingMode.CEIL) {
            if (mm > 0) result += 1;
        } else {
            if (mm > ((z - 1) / 2)) result += 1; // z should be z-1
        }
        return result;
    }

    /// Return (x*y) as a "virtual uint512" (lo, hi), representing (hi*2**256 + lo)
    ///   Adapted from sources:
    ///   https://medium.com/wicketh/27650fec525d, https://medium.com/coinmonks/4db014e080b1
    /// @dev Intended to be internal to this library
    /// @return hi (hi, lo) satisfies  hi*(2**256) + lo == x * y
    /// @return lo (paired with `hi`)
    function fullMul(uint256 x, uint256 y) public pure returns (uint256 hi, uint256 lo) {
        unchecked {
            uint256 mm = mulmod(x, y, uint256(0) - uint256(1));
            lo = x * y;
            hi = mm - lo;
            if (mm < lo) hi -= 1;
        }
    }
}
    