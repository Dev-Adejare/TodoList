import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe('Todos Test', () => {
    const deployTodosFixture  = async () => {

        const [owner, otherAccount] = await hre.ethers.getSigners();
    
        const Todos = await hre.ethers.getContractFactory("Todos");
        const todos = await Todos.deploy()
    
        return { todos, owner, otherAccount};
        
    }

    describe("deployment", () => {
        it("Should check if it deployed", async function () {
            const { todos, owner } = await loadFixture(deployTodosFixture);
      
            expect(await todos.owner()).to.equal(owner);
        });

       
    });

    describe('creating Todo', () => {

        it("Should allow owner to create todo", async () => {
            const { todos, owner } = await loadFixture(deployTodosFixture);


            const title = "My First Todo";
            const description = "This is the first desc";
      
            // Create the todo
            await todos.connect(owner).createTodo(title, description);
      
            const todo = await todos.getTodo(0);
      
            expect(todo[0]).to.equal(title);
            expect(todo[1]).to.equal(description);
            expect(todo[2]).to.equal(1); 


        });

        it("Should emit TodoCreated event", async function () {
            const { todos, owner } = await loadFixture(deployTodosFixture);
            const title = "My First Todo";
            const description = "This is the first desc";
      
            await expect(todos.connect(owner).createTodo(title, description))
              .to.emit(todos, "TodoCreated")
              .withArgs(title, 1); // 1 corresponds to Status.Created
          });


          it("Should not allow non-owners to create a Todo", async function () {
            const { todos, otherAccount } = await loadFixture(deployTodosFixture);
            const title = "My First Todo";
            const description = "This is a description";
      
            await expect(
              todos.connect(otherAccount).createTodo(title, description)
            ).to.be.revertedWith("You're not allowed");
          });
      
    });


    describe("Updating Todos", () => {
        it("Should allow the owner to update a Todo", async function () {
          const { todos, owner } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          // Create the todo
          await todos.connect(owner).createTodo(title, description);
    
          const newTitle = "Updated Todo";
          const newDescription = "Updated description";
    
          // Update the todo
          await todos.connect(owner).updateTodo(0, newTitle, newDescription);
    
          const todo = await todos.getTodo(0);
    
          expect(todo[0]).to.equal(newTitle);
          expect(todo[1]).to.equal(newDescription);
          expect(todo[2]).to.equal(2); // Status.Edited
        });
    
        it("Should emit TodoUpdated event", async function () {
          const { todos, owner } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          await todos.connect(owner).createTodo(title, description);
    
          const newTitle = "Updated Todo";
          const newDescription = "Updated description";
    
          await expect(
            todos.connect(owner).updateTodo(0, newTitle, newDescription)
          )
            .to.emit(todos, "TodoUpdated")
            .withArgs(newTitle, 2); // 2 corresponds to Status.Edited
        });
    
        it("Should not allow non-owners to update a Todo", async function () {
          const { todos, owner, otherAccount } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          await todos.connect(owner).createTodo(title, description);
    
          await expect(
            todos.connect(otherAccount).updateTodo(0, "New Title", "New Description")
          ).to.be.revertedWith("You're not allowed");
        });
      });


      describe("Deleting Todos", () => {
        it("Should allow the owner to delete a Todo", async function () {
          const { todos, owner } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          await todos.connect(owner).createTodo(title, description);
    
          // Delete the todo
          await todos.connect(owner).deleteTodo(0);
    
          // Try to get the deleted todo
          await expect(todos.getTodo(0)).to.be.revertedWith("Index is out-of-bound");
        });
    
        it("Should not allow non-owners to delete a Todo", async function () {
          const { todos, owner, otherAccount } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          await todos.connect(owner).createTodo(title, description);
    
          await expect(
            todos.connect(otherAccount).deleteTodo(0)
          ).to.be.revertedWith("You're not allowed");
        });
      });



      describe("Marking Todo as Completed", () => {
        it("Should allow the owner to mark a Todo as done", async function () {
          const { todos, owner } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          await todos.connect(owner).createTodo(title, description);
    
          await todos.connect(owner).todoCompleted(0);
    
          const todo = await todos.getTodo(0);
          expect(todo[2]).to.equal(3); // Status.Done
        });
    
        it("Should not allow non-owners to mark a Todo as done", async function () {
          const { todos, owner, otherAccount } = await loadFixture(deployTodosFixture);
          const title = "My First Todo";
          const description = "This is a description";
    
          await todos.connect(owner).createTodo(title, description);
    
          await expect(todos.connect(otherAccount).todoCompleted(0)).to.be.revertedWith("You're not allowed");
        });
      });
    
    
    
  
})