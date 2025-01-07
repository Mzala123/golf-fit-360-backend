
const pool = require("./db")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")

const createTableUser = async()=>{
    const createTableQuery = 
    ` 
     CREATE TABLE IF NOT EXISTS users
     (
      userId SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR NOT NULL,
      address TEXT,
      phonenumber VARCHAR(30),
      golf_club_size VARCHAR(30),
      hash VARCHAR NOT NULL,
      salt VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )
    `
    try{
        const client = await pool.connect()
        await client.query(createTableQuery)
        console.log("Table users created or already exists")
        client.release()
    }catch(err){
        console.log("Error creating table users "+err)
    }
}


const getUserByEmail = async(email)=>{
   const result = await pool.query("SELECT * FROM users WHERE email=$1",
    [
      email
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
    setPassword,
    validPassword,
    generateJwt,
    getUserByEmail
}


