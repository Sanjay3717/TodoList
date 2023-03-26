const express = require("express");
const path = require("path");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let db = null;

module.exports = app;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);

    process.exit(1);
  }
};

initializeDBAndServer();

/*app.get("/todos/", async (request, response) => {
  const { status } = request.query;
  const getAllTodos = `select * from todo`;
  const getArray = await db.all(getAllTodos);
  response.send(getArray);
}); */

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//Get one Todo item based on input (id)
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log({ todoId });
  const getItem = `select * from todo where id = ${todoId};`;
  const getItemArray = await db.get(getItem);
  response.send(getItemArray);
});

//Create a todo item

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { todo, priority, status } = todoDetails;
  const addItem = `insert into todo (todo,priority,status) values ('${todo}','${priority}','${status}');`;
  const dbResponse = await db.run(addItem);
  const id = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

//Update Todo Item values

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log({ todoId });
  let updatedColumn = "";
  const requestBody = request.body;

  const previousQuery = `select * from todo where id = ${todoId};`;
  console.log({ todoId });
  const previousTodo = await db.get(previousQuery);
  console.log({ previousTodo });
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  console.log(priority);

  const updateDetails = `update todo set status = '${status}', priority = '${priority}',todo = '${todo}' where id = ${todoId};`;
  const newTodoValues = await db.run(updateDetails);

  const {
    newtodo = newTodoValues.todo,
    newpriority = newTodoValues.priority,
    newstatus = newTodoValues.status,
  } = request.body;
  console.log(newpriority);

  switch (true) {
    case status !== newstatus:
      updatedColumn = "Status";
      console.log(`${updatedColumn}`);
      break;
    case priority !== newpriority:
      updatedColumn = "Priority";
      console.log(`${updatedColumn}`);
      break;
    case todo !== newtodo:
      updatedColumn = "Todo";
      console.log(`${updatedColumn}`);
      break;
  }
  console.log(`Hello ${updatedColumn}`);

  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const deleteItem = `delete from todo where id = ${todoId};`;
  await db.run(deleteItem);
  response.send("Todo Deleted");
});

app.listen(3000, () => {
  console.log("Server is running");
});
