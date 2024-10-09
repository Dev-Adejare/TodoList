import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Lock = await hre.ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Lock = await hre.ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});




// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TodoList.sol";

contract TestTodoList {
    // Create a new instance of the TodoList contract for testing
    TodoList todoList;

    function beforeAll() public {
        // Deploy the contract before running tests
        todoList = new TodoList();
    }

    function testOwnerIsSetCorrectly() public {
        // Assert that the owner of the contract is the address running the test
        address expectedOwner = address(this);
        address owner = todoList.owner();
        Assert.equal(owner, expectedOwner, "Owner should be the address deploying the contract");
    }

    function testCreateTodo() public {
        // Test creating a new todo
        bool created = todoList.createTodo("Test Todo", "This is a test todo");
        Assert.isTrue(created, "Todo should be created successfully");

        // Verify the newly created todo
        (string memory title, string memory description, TodoList.Status status) = todoList.getTodo(0);
        Assert.equal(title, "Test Todo", "Todo title should match");
        Assert.equal(description, "This is a test todo", "Todo description should match");
        Assert.equal(uint(status), uint(TodoList.Status.Created), "Todo status should be 'Created'");
    }

    function testUpdateTodo() public {
        // Test updating a todo
        todoList.updateTodo(0, "Updated Test Todo", "This is an updated test todo");

        // Verify the updated todo
        (string memory title, string memory description, TodoList.Status status) = todoList.getTodo(0);
        Assert.equal(title, "Updated Test Todo", "Todo title should be updated");
        Assert.equal(description, "This is an updated test todo", "Todo description should be updated");
        Assert.equal(uint(status), uint(TodoList.Status.Edited), "Todo status should be 'Edited'");
    }

    function testCompleteTodo() public {
        // Test marking a todo as completed
        bool completed = todoList.todoCompleted(0);
        Assert.isTrue(completed, "Todo should be marked as completed");

        // Verify the todo's status
        (, , TodoList.Status status) = todoList.getTodo(0);
        Assert.equal(uint(status), uint(TodoList.Status.Done), "Todo status should be 'Done'");
    }

    function testDeleteTodo() public {
        // Test deleting a todo
        todoList.deleteTodo(0);

        // Verify that the todo list is empty after deletion
        TodoList.Todo[] memory allTodos = todoList.getAllTodo();
        Assert.equal(allTodos.length, 0, "Todo list should be empty after deletion");
    }
}

