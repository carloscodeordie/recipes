import express from "express";
import { Recipe } from "./interfaces/recipe";
const path = require("path");

const app = express();
const port = 3000;

export let recipe: Recipe | null = null;

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

// Display New Recipe page
app.get("/recipes/new", (req, res) => {
  // Initialize the recipe as empty (create new recipe on the database)
  recipe = {};

  res.setHeader("HX-Redirect", "/recipes/new");
  res.render("new-recipe");
});

app.post("/processes", (req, res) => {
  const { name } = req.body;
  // Set the recipe name (update created recipe)
  recipe.name = name;
  res.send();
});

app.listen(port, () => {
  return console.log(`listening at port: ${port}`);
});
