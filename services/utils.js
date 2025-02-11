const pool = require('../model/db');
const getUser = async(req)=>{
    if (!req.auth || !req.auth.userId) {
        throw new Error('Unauthorized: Missing authentication');
    }
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

const getSQLFilter = (fields = [])=>{
    return (placeholder)=>{
        return fields.map((field, index)=>`${field} ILIKE ${placeholder}`).join(" OR ")
    }
}


const getSortQuery = (sort)=>{
    const sortDirection = sort.includes("-") ? "DESC" : "ASC";
    const sortColumn = sort.replaceAll("-","");
    return sortColumn ? `ORDER BY ${sortColumn} ${sortDirection}`:''
}

const getPageOffset = (page, limit, totalItems)=>{
    page = (parseInt(limit) > totalItems ? 1 : parseInt(page)) || 1;
    limitDefault = parseInt(limit) || 5;
    const offset = (page - 1) * limitDefault
    return {limitDefault, offset};
}

module.exports = {getUser, getSQLFilter, getSortQuery, getPageOffset}




