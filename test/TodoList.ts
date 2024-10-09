import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TodoList Test", () => {
  const deployTodoListFixture = async () => {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const TodoList = await hre.ethers.getContractFactory("TodoList");
    const todoList = await TodoList.deploy();

    return { todoList, owner, otherAccount };
  };

  describe("Deployment", () => {
    it("should check if the contract is deployed", async () => {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      expect(await todoList.owner()).to.equal(owner.address);
    });

    it("should allow the owner to create a todo", async () => {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTodo("Will eat", "....");
    });

    it("should not allow non-owners to create a todo", async () => {
      const { todoList, otherAccount } = await loadFixture(
        deployTodoListFixture
      );

      await expect(
        todoList.connect(otherAccount).createTodo("Will sleep", "....")
      ).to.be.revertedWith("You are not allowed");
    });

    it("should allow owner to update a todo", async () => {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTodo("Bla bla bla", "😍");

      await todoList.connect(owner).updateTodo(0, "Bala blue", "Hulaba🤣");
    });

    it("should allow owner to mark todo as completed", async () => {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTodo("Oops", "......");

      await todoList.connect(owner).todoCompleted(0);
    });

    it("should allow owner to delete a todo", async () => {
      const { todoList, owner } = await loadFixture(deployTodoListFixture);

      await todoList.connect(owner).createTodo("Delete", ".....");

      await todoList.connect(owner).deleteTodo(0);
    });
  });
});