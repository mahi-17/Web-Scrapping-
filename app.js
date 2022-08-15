const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _=require("lodash");

// console.log(date());

const app = express();
app.set("view engine", 'ejs'); //  we need to initialize before the app 
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// new added item will be delacred globally
var addedItems = ["buy foot items", "cook the food"];
var workItems = [];

const port = 3000;
// replace mogngodb connect u r appliction
mongoose.connect("mongodb+srv://admin:admin123@cluster0.eq6cpt6.mongodb.net/todolistDB", { useNewUrlParser: true });
// creating the database schema

const itemSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "welcom to your to do list"
})
const item2 = new Item({
    name: "Hit the + button to add new item."
})
const item3 = new Item({
    name: "<-- click the check list to delete"
})
const defaultItems = [item1, item2, item3]

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
    // we have to add all the marker in single render file 
    let day = date();
    Item.find({}, function (err, foundItems) {
        // console.log(foundItems);

        if (foundItems.length === 0) {
            console.log("i am inside")
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("succesfully saved DB")
                }
            })
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today", newListItems: foundItems
            });
        }

        // res.render("list", {
        //     listTitle: day, newListItems: foundItems
        // });


    })

});

app.get("/:customListName", function (req, res) {
     const customListName = _.capitalize(req.params.customListName);
    // const customListName =(req.params.customListName);
    // console.log(customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list 
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect("/" + customListName);
            } else {
                //show an exsisting list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })


})

// app.get("/work", function (req, res) {
//      res.render("list", { listTitle: "work List", newListItems: workItems })
// })

app.post("/", function (req, res) {
    // console.log(req.body) //list is the key in which list items are added

    // adding new items to todolist data base
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        // we need to find from which root it came 
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }


    // let Item = req.body.newItem
    // if (req.body.list === "work") {
    //     workItems.push(Item);
    //     res.redirect("/work");
    // } else {
    //     addedItems.push(Item);
    //     res.redirect("/");
    // }

    // after ading the items we need to redirect to home 
    // res.redirect("/" );
    // res.send("your  tody to do " + addedItem);
})

app.post("/delete", function (req, res) {
    // console.log(req.body.checkbox);
    const checkedItemId = req.body.checkbox;
    const listName=req.body.listName;

    if(listName==="Today"){
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("seccesfully removed");
                res.redirect("/");
            }
        })
    }else{
        // using the mogos remove document using the pull 
        // remove a document from the collections
        List.findOneAndUpdate({name:listName} ,{$pull:{items:{_id:checkedItemId}}},function(err ,foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        })

    }
    
})

app.get("/about", function (req, res) {
    res.render("about");
})
app.listen(port, function () {
    console.log("server started on port " + port);
})