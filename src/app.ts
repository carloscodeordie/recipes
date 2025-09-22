import express from "express";
import { v4 as uuid } from "uuid";
import { Recipe } from "./interfaces/recipe";
import { Process } from "./interfaces/process";

const path = require("path");
const app = express();
const port = 3000;

let recipe: Recipe | null = null;
const recipes: Recipe[] = [];

app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.set("view engine", "ejs");

// Display Home page
app.get("/", (req, res) => {
  res.render("home");
});

// Create a new recipe
app.post("/recipes", (req, res) => {
  // Initialize the recipe as empty (create new recipe on the database)
  recipe = {
    id: uuid(),
    name: "New recipe",
    processes: [],
  };
  recipes.push(recipe);

  res.setHeader("HX-Redirect", "/recipe");
  res.redirect(`/recipe/${recipe.id}`);
});

app.get("/recipe/:recipeId", (req, res) => {
  // Get the recipe id from request params
  const id = req.params.recipeId;

  // Get the recipe from cache
  const recipe = recipes.find((recipe) => recipe.id === id);

  res.setHeader("HX-Redirect", `/recipe/${id}`);
  res.render("recipe", {
    recipe,
  });
});

app.post("/processes", (req, res) => {
  const { name } = req.body;
  // Create a new process (create process on database)
  const process: Process = {
    id: uuid(),
    name: name,
  };
  res.render("workflow", {
    process,
  });
});

app.listen(port, () => {
  return console.log(`listening at port: ${port}`);
});
