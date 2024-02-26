const express = require('express')
const app = express()
const path = require('path')
const filePath = path.join(__dirname, 'todoApplication.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
let db

const intilaizeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server runnig at http://localhost:3000/')
    })
  } catch (err) {
    console.log(`Database error : ${err.message}`)
    process.exit(1)
  }
}

intilaizeDbAndServer()

const checkRequestQueris = (req, res, next) => {
  const {status, priority, category, date, search_q} = req.query
  const {todoId} = req.params
  if (status !== undefined) {
    const statsuArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isValidStatus = statsuArray.includes(status)
    console.log(isValidStatus)
    if (isValidStatus === true) {
      req.status = status
    } else {
      res.status(400)
      res.send('Invalid Todo Status')
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const isValidPriority = priorityArray.includes(priority)
    if (isValidPriority === true) {
      req.priority = priority
    } else {
      res.status(400)
      res.send('Invalid Todo Priority')
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isValidCategory = categoryArray.includes(category)
    if (isValidCategory === true) {
      req.category = category
    } else {
      res.status(400)
      res.send('Invalid Todo Category')
    }
  }

  if (date !== undefined) {
    const myDate = new Date(date)
    format(myDate, 'yyyy/MM/dd')
    console.log(myDate)
    if (isValid(myDate) === true) {
      req.date = myDate
    } else {
      res.status(400)
      res.send('Invalid Due Date')
    }
  }

  req.todoId = todoId
  req.search_q = search_q
  next()
}

// API 1

app.get('/todos/', checkRequestQueris, async (req, res) => {
  const {status = '', category = '', priority = '', search_q = ''} = req
  const sqliteQuery = `SELECT id ,
                                    todo,
                                    status,
                                    category,
                                    priority,
                                    due_date as dueDate FROM 
                                    todo 
                                    WHERE 
                                    status LIKE "%${status}%" AND 
                                    category LIKE  "%${category}%" AND 
                                    priority LIKE "%${priority}%" AND
                                    todo LIKE "%${search_q}%"`
  const dbResponse = await db.all(sqliteQuery)
  res.send(dbResponse)
})

app.get('/todos/:todoId/', checkRequestQueris, async (req, res) => {
  const todoId = req.todoId
  const sqliteQuery = `SELECT id , todo , status, category, priority , due_date as dueDate FROM todo WHERE id = ${todoId}`
  const dbResponse = await db.get(sqliteQuery)
  res.send(dbResponse)
})
module.exports = app

// API 3
app.get('/agenda/', checkRequestQueris, async (req, res) => {
  const {date} = req
  console.log(date)

  const sqliteQuery = `SELECT id, status, category, priority, due_date AS dueDate, todo FROM todo 
                       WHERE due_date = ?`
  const dbResponse = await db.all(sqliteQuery, [
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  ])
  res.send(dbResponse)
})
