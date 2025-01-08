
const pool = require("./db")

const createTableGolfClubMessage = async()=>{
  const createTableQuery = 
    `
      CREATE TABLE IF NOT EXISTS golf_club_messages
      (
         messageId SERIAL PRIMARY KEY,
         message TEXT NOT NULL,
         messageType VARCHAR(255) UNIQUE NOT NULL,
         createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try{
        const client = await pool.connect()
        await client.query(createTableQuery)
        console.log("Table golf_club_messages created or already exists")
    }catch(err){
         console.log("Error creating table golf_club_messages "+err)   
    }
}

module.exports = createTableGolfClubMessage