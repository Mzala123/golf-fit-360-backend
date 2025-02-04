const pool = require('../model/db');
const getUser = async(req)=>{
    if (!req.auth || !req.auth.userId) {
        throw new Error('Unauthorized: Missing authentication');
    }
    //return req.auth;
     try{
        const response = await pool.query(`SELECT * FROM users WHERE userId= $1`,
            [
                req.auth.userId
            ])
        if(response.rows.length === 0){
            throw new Error('User not found');
        }
        return response.rows[0]
     }catch(error){
        throw new Error(error.message);   
     }   
}

module.exports = getUser