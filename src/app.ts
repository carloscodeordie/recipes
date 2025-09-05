import express from "express";
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home");
});

app.listen(port, () => {
  return console.log(`listening at port: ${port}`);
});
