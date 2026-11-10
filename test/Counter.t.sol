// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Counter} from "../src/Counter.sol";

/// @notice Dependency-free Foundry smoke tests for the toolchain baseline.
contract CounterTest {
    Counter internal counter;

    function setUp() public {
        counter = new Counter();
    }

    function testInitialNumberIsZero() public view {
        require(counter.number() == 0, "unexpected initial number");
    }

    function testSetNumber() public {
        counter.setNumber(42);
        require(counter.number() == 42, "setNumber failed");
    }

    function testIncrement() public {
        counter.increment();
        require(counter.number() == 1, "increment failed");
    }

    function testFuzzSetNumber(uint256 input) public {
        counter.setNumber(input);
        require(counter.number() == input, "fuzz setNumber failed");
    }
}
