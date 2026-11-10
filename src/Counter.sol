// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice A minimal, non-vulnerable compilation and testing fixture.
/// @dev Issue #3 will add intentionally vulnerable AND patched ERC-4626 targets.
contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) external {
        number = newNumber;
    }

    function increment() external {
        number += 1;
    }
}
