
const pool = require("./db")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")

const createTableUser = async()=>{
    const createTableQuery = 
    ` 
     CREATE TABLE IF NOT EXISTS users
     (
      userId SERIAL PRIMARY KEY,
      userName VARCHAR(255) UNIQUE NOT NULL,
      userType VARCHAR(30) NOT NULL,
      hash VARCHAR NOT NULL,
      salt VARCHAR NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
    `;

    try{
        const client = await pool.connect()
        await client.query(createTableQuery)
        console.log("Table users created or already exists")
        client.release()
    }catch(err){
        console.log("Error creating table users "+err)
    }
}



const createTableCustomer = async()=>{
    const createTableQuery = 
    `
     CREATE TABLE IF NOT EXISTS customers
     (
       customerId SERIAL PRIMARY KEY,
       userId INTEGER NOT NULL,
       firstName VARCHAR(100) NOT NULL,
       lastName VARCHAR(100) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       phoneNumber VARCHAR(30),
       address TEXT,
       gender VARCHAR(10),
       golfClubSize VARCHAR(50)
     )
    `;
    try{
        const client = await pool.connect()
        await client.query(createTableQuery)
        console.log("Table customer created or already exists")
        client.release()
    }catch(err){
        console.log("Error creating table patient "+err)
    }
}

const createTableAdmin = async()=>{
    const createTableQuery = 
    `
      CREATE TABLE IF NOT EXISTS admin
      (
        adminId SERIAL PRIMARY KEY,
        userId INTEGER  NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL
      );
    `;

    try{
        const client = await pool.connect()
        await client.query(createTableQuery)
        console.log("Table admin created or already exists")
        client.release()
    }catch(err){
        console.log("Error creating table admin")
    }
}



const getUserByEmail = async(username)=>{
   const result = await pool.query("SELECT * FROM users WHERE username=$1",
    [
      username
    ]).then((response)=>{
        return response.rows
    }).catch((err)=>{
        return err
    })
    return result
}

const setPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('base64');
    return { salt, hash };
};

const validPassword = (user, password)=>{
     const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('base64');
     return user.hash === hash
}


const generateJwt = (user) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign(
        {
            userId: user.userId,
            email: user.email,
            name: user.name,
            exp: parseInt(expiry.getTime() / 1000),
        },
        process.env.JWT_SECRET
    );
};

module.exports = {
    createTableUser,
    createTableCustomer,
    createTableAdmin,
    setPassword,
    validPassword,
    generateJwt,
    getUserByEmail
}


