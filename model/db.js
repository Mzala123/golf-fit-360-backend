const {Pool} = require("pg")

const pool = new Pool({
    host: process.env.DB_HOST,
    port:process.env.DB_PORT,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DATABASE_NAME
})


pool.on("connect", ()=>{
    console.log("connected")
})

module.exports = pool
