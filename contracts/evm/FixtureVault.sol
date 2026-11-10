// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {MockAsset} from "./MockAsset.sol";

/// @notice Minimal ERC-4626-style deposit/redeem fixture, not a production vault.
abstract contract FixtureVault {
    MockAsset public immutable asset;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(MockAsset asset_) {
        asset = asset_;
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0 && receiver != address(0), "invalid deposit");
        shares = previewDeposit(assets);
        require(asset.transferFrom(msg.sender, address(this), assets), "transfer failed");
        totalSupply += shares;
        balanceOf[receiver] += shares;
    }

    function redeem(uint256 shares, address receiver) external returns (uint256 assets) {
        require(shares > 0 && receiver != address(0), "invalid redeem");
        require(balanceOf[msg.sender] >= shares, "shares");
        assets = previewRedeem(shares);
        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        require(asset.transfer(receiver, assets), "transfer failed");
    }

    function previewDeposit(uint256 assets) public view virtual returns (uint256);
    function previewRedeem(uint256 shares) public view virtual returns (uint256);
}

/// @notice Intentionally vulnerable to donation-driven share rounding to zero.
contract VulnerableVault is FixtureVault {
    constructor(MockAsset asset_) FixtureVault(asset_) {}

    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return totalSupply == 0 ? assets : assets * totalSupply / totalAssets();
    }

    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return shares * totalAssets() / totalSupply;
    }
}

/// @notice Virtual offset makes the same donation attack unprofitable in this fixture.
contract PatchedVault is FixtureVault {
    uint256 public constant VIRTUAL_SHARES = 1_000_000;

    constructor(MockAsset asset_) FixtureVault(asset_) {}

    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return assets * (totalSupply + VIRTUAL_SHARES) / (totalAssets() + 1);
    }

    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return shares * (totalAssets() + 1) / (totalSupply + VIRTUAL_SHARES);
    }
}
