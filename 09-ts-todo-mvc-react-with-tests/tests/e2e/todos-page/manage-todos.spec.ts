import { todosEndpoint, getUserEndpoint, pageUrl } from '../../../src/consts/urls';

function authorize() {
  cy.intercept(
    'GET',
    getUserEndpoint,
    { fixture: 'user.response.json' }
  ).as('authorize');

  cy.intercept(
    'GET',
    todosEndpoint,
    { fixture: 'empty-todos-list.response.json' }
  ).as('initialTodos');

  cy.visit(pageUrl)
    .wait('@authorize')
    .wait('@initialTodos');
}

function addTodoItem(itemText: string) {
      cy.fixture('todo-item.response.json').then((todoItemResponse) => {
        cy.intercept(
            'POST',
            todosEndpoint,
            req => {
              const {body} = req;
              req.reply({
                statusCode: 200,
                body: JSON.stringify({
                  ...todoItemResponse,
                  text: body.text
                })
              });
            }
        ).as('createTodo');
      });

      authorize();
      cy.get('[data-test-id=create-new-todo-form]').should('be.visible');
      cy.get('[data-test-id=create-new-todo-form__todo-text-input]').type(itemText);
      cy.get('[data-test-id=create-new-todo-form]').submit();

      cy.wait('@createTodo');
}

function deleteTodoItem() {
  cy.fixture('todo-item.response.json').then((todoItemResponse)  => {
    cy.intercept(
        'DELETE',
        todosEndpoint,
        req => {
          const { body } = req;
          req.reply({
            statusCode: 200,
            body: JSON.stringify({
              ...todoItemResponse,
              id: "123"
            })
          });
        }
    ).as('deleteTodo');
  });

  cy.get('[data-test-id=todo-item__remove-action]').click({ force: true });

  cy.wait('@deleteTodo')
}

describe('Manage Todos', () => {
  context('Creation', () => {
    it('Create todo', () => {
      const itemText = Math.random().toString() + '_' + Date.now();

      addTodoItem(itemText)

      cy.get('[data-test-id=todos-list]').should('be.visible');

      cy.get('[data-test-id=todo-item]').should('be.visible');
      cy.get('[data-test-id=todo-item__checked-checkbox]').should('not.be.checked');
      cy.get('[data-test-id=todo-item__text-input]').should('have.value', itemText);
      cy.get('[data-test-id=todo-item__remove-action]').should('be.visible');
    });
  });

  context("Deletion", () => {
    it("Delete todo item", () => {

      const itemText = Math.random().toString() + '_' + Date.now();

      addTodoItem(itemText)

      cy.get('[data-test-id=todo-item__remove-action]').should('be.visible');

      deleteTodoItem()

      cy.get('[data-test-id=todo-item__remove-action]').should('not.exist')
      cy.get('[data-test-id=todo-item__text-input]').should('not.exist')
      cy.get('[data-test-id=todo-item]').should('not.exist');
    });
  });
});

