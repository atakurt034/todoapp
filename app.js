// jshint esversion:6
const express = require('express')
const fp = require('lodash/fp')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

const day = require(__dirname + '/date')
const app = express()
dotenv.config()

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('server connected')
  })
  .catch((err) => {
    console.log(err)
  })

// schema's
const itemsSchema = {
  name: {
    type: String,
    required: [true, 'please input text'],
  },
}

const listSchema = {
  name: String,
  items: [itemsSchema],
}

// models
const Item = mongoose.model('Item', itemsSchema)
const CustomList = mongoose.model('CustomList', listSchema)

const item1 = new Item({
  name: 'Welcome to your todolist!',
})
const item2 = new Item({
  name: 'Input text and press + to add',
})
const item3 = new Item({
  name: '<-- Press this to delete',
})

// arrays
const defaultItems = [item1, item2, item3]

// Express CODES
app.use(
  express.urlencoded({
    extended: true,
  })
)
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => {
  try {
    Item.find(
      {},
      {
        name: 1,
      }
    ).then((foundItm) => {
      if (foundItm.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log('added ' + defaultItems.length)
          })
          .catch((err) => {
            sconsole.log('Failed ' + err)
          })
        res.redirect('/')
      } else {
        res.render('list', {
          listTitle: day.date(),
          newListItems: foundItm,
        })
      }
    })
  } catch (error) {
    console.log(error)
  }
})
app.post('/', (req, res) => {
  const itemName = req.body.newItem
  const listName = req.body.list

  const itemToPass = new Item({
    name: itemName,
  })
  if (listName === day.date()) {
    itemToPass.save().then(() => {
      console.log('successfully added ' + itemToPass)
    })
    res.redirect('/')
    console.log('yes')
  } else {
    CustomList.findOne(
      {
        name: listName,
      },
      (err, foundList) => {
        foundList.items.push(itemToPass)
        foundList.save()
        res.redirect('/' + listName)
      }
    )
  }
})

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if (listName === day.date()) {
    Item.findByIdAndRemove(checkedItemId, {
      useFindAndModify: false,
    })
      .then(() => {
        console.log('successfully deleted ' + checkedItemId)
      })
      .catch((err) => {
        console.log(err)
      })
    res.redirect('/')
  } else {
    CustomList.findOneAndUpdate(
      {
        name: listName,
      },
      {
        $pull: {
          items: {
            _id: checkedItemId,
          },
        },
      },
      {
        useFindAndModify: false,
      }
    ).then((results) => {
      CustomList.find().then((list) => {
        console.log(
          list.forEach((n) => {
            return n.name
          })
        )
      })
      res.redirect('/' + results.name)
    })
  }
})

app.get('/:customListName', (req, res) => {
  var customName = fp.capitalize(req.params.customListName)
  CustomList.findOne(
    {
      name: customName,
    },
    (err, foundList) => {
      if (!err) {
        if (!foundList) {
          var customList = new CustomList({
            name: customName,
            items: defaultItems,
          })
          customList.save()
          res.redirect('/' + customName)
        } else {
          res.render('list', {
            listTitle: foundList.name,
            newListItems: foundList.items,
          })
        }
      }
    }
  )
})

let port = process.env.PORT
if (port == null || port == '') {
  port = 3000
}
app.listen(port, (req, res) => {
  console.log('server started: 3000')
})
