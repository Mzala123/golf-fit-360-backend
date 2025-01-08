const pool = require("./db")

const createTableFittingRequest = async()=>{
  const createTableQuery =  `
     CREATE TABLE IF NOT EXISTS fitting_requests
     (
       fittingId SERIAL PRIMARY KEY,
       userId INTEGER NOT NULL,
       fittingServiceCategory TEXT NOT NULL,
       status VARCHAR(255) NOT NULL,
       fittingScheduleDate DATE NOT NULL,
       fittingScheduleTime TIME(0) NOT NULL,
       comments TEXT,
       createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )
    `;

    try{
      const client = await pool.connect()
      await client.query(createTableQuery)
      console.log("Table fitting_requests created or already exists")
    }catch(err){
      console.log("Error created table fitting_requests "+err)
    }
}


const createTableFittingTasks = async()=>{
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS fitting_tasks
      (
        fittingTaskId SERIAL PRIMARY KEY,
        fittingId INTEGER NOT NULL,
        taskName VARCHAR(255) NOT NULL,
        fittingTaskStatus VARCHAR(255) NOT NULL,
        completedBy INTEGER,
        index INTEGER NOT NULL,
        isDone SMALLINT NOT NULL DEFAULT 0 CHECK (isDone IN (0,1)),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    try{
        const client = await pool.connect()
        await client.query(createTableQuery)
        console.log("Table fitting_tasks created or already exists")
      }catch(err){
        console.log("Error created table fitting_requests "+err)
      }
}


module.exports = {createTableFittingRequest, createTableFittingTasks}