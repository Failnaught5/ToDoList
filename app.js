//package setup

const express = require("express");

const app = express();

require('dotenv').config();

const _ = require("lodash");

const mongoose = require('mongoose');

mongoose.set("strictQuery", false);

mongooseConnect().catch(err => console.log(err));

async function mongooseConnect() {

  await mongoose.connect(process.env.DB_ADDRESS);

  console.log("Successfully connected");

}

app.set('view engine', 'ejs');

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//package setup done

const itemsSchema = new mongoose.Schema({
  message: String
});

const Item = mongoose.model("Item", itemsSchema);

const wakeUp = new Item({
  message: "Wake up"
})

const brushTeeth = new Item({
  message: "Brush your teeth"
})

const goBack = new Item({
  message: "Go back to sleep"
})

const defaultItems = [wakeUp, brushTeeth, goBack];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {

  Item.find(async function(err, items) {

    if (err) {
      console.log(err);
    } else {
      console.log("No errors in the find() function");
    }

    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted default to do items into DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });

});

app.get("/today", function(req, res) {
  res.redirect("/");
})

app.get("/:customCategory", async function(req, res) {
  const categoryName = _.capitalize(req.params.customCategory);

  List.findOne({
    name: categoryName
  }, async function(err, foundList) {
    if (err) {
      console.log(err);
    } else {
      console.log("Finding lists");
    }

    if (!foundList) {
      console.log("no existing list of the same name; creating new list");
      const newList = new List({
        name: categoryName,
        items: defaultItems
      });
      await newList.save();
      res.render("list", {
        listTitle: categoryName,
        newListItems: defaultItems
      });
    } else {
      console.log("list found");
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }

  });
});

app.post("/", async function(req, res, err) {
  const list = req.body.list;
  const newItem = new Item({
    message: req.body.newItem
  })

  if (list === "Today") {
    await newItem.save();
    res.redirect("/");
  } else {
    await List.updateOne({
      name: list
    }, {
      $push: {
        items: newItem
      }
    });
    res.redirect("/" + list);
  }


});

app.post("/delete", async function(req, res) {

  const itemID = req.body.checkbox;

  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.deleteOne({
      _id: itemID
    });

    res.redirect("/");
  } else {
    await List.updateOne({name: listName}, {
      $pull: {
        items: {_id: itemID}
      }
    })

    res.redirect("/" + listName);
  }


});



app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.port || 3000, function() {
  console.log("Server started on port 3000");
});
