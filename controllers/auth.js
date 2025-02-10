const jwt = require("jsonwebtoken")
const sendJSONresponse = require('../services/response')
const { setPassword, generateJwt,
    getUserByEmail } = require("../model/user");

const pool = require('../model/db');
const passport = require('passport');

const { getSQLFilter, getSortQuery, getPageOffset} = require("../services/utils")

module.exports.registerCustomer = async (req, res) => {
    if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.password) {
        return sendJSONresponse(res, 400, {
            message: "Fill in all required fields",
        });
    }

    const { firstName, lastName, email, password, address, phoneNumber, gender, golfClubSize } = req.body;
    const userType = "CUSTOMER";

    try {
        const userExist = await getUserByEmail(email);
        if (userExist.length > 0) {
            return sendJSONresponse(res, 400, { message: "Email already in use with another customer" });
        }

        const { salt, hash } = setPassword(password);

        await pool.query('BEGIN');

        const userInsertQuery = `
            INSERT INTO users (userName, userType, hash, salt)
            VALUES ($1, $2, $3, $4)
            RETURNING userId, userName, userType;
        `;
        const userRecord = await pool.query(userInsertQuery, [email, userType, hash, salt]);
        const userId = userRecord.rows[0].userid;

        const customerInsertQuery = `
            INSERT INTO customers (userId, firstname, lastname, email, phonenumber, address, gender, golfclubsize)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING userId, firstname, lastname, email, phonenumber, address, gender, golfclubsize;
        `;
        const customerResponse = await pool.query(customerInsertQuery, [userId, firstName, lastName, email, phoneNumber, address, gender, golfClubSize]);

        const token = generateJwt(userRecord.rows[0]);

        await pool.query("COMMIT");

        sendJSONresponse(res, 201, {
            token,
            user: userRecord.rows[0],
            customer: customerResponse.rows[0],
            message: "Golffit Customer has been registered successfully!"
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        sendJSONresponse(res, 400, {
            message: "Failed to register Golffit user",
            error: err.message || err,
        });
    }
};



module.exports.registerAdmin = async (req, res) => {
    if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.password) {
        return sendJSONresponse(res, 400, {
            message: "Fill in all required fields",
        });
    }

    const { firstName, lastName, email, password } = req.body;
    const userType = "ADMIN";

    try {
        const userExist = await getUserByEmail(email);
        if (userExist.length > 0) {
            return sendJSONresponse(res, 400, { message: "Email already in use with another user" });
        }

        const { salt, hash } = setPassword(password);
        await pool.query('BEGIN');

        const userInsertQuery = `
            INSERT INTO users (userName, userType, hash, salt)
            VALUES ($1, $2, $3, $4)
            RETURNING userId, userName, userType;
        `;
        const userRecord = await pool.query(userInsertQuery, [email, userType, hash, salt]);
        const userId = userRecord.rows[0].userid;

        const adminInsertQuery = `
         INSERT INTO admin (userId, firstName, lastName)
         VALUES ($1,$2,$3) 
         RETURNING userid, firstname, lastname
        `
        const adminResponse = await pool.query(adminInsertQuery, [userId, firstName, lastName])

        const token = generateJwt(userRecord.rows[0])

        await pool.query("COMMIT")

        sendJSONresponse(res, 201,
            {
                token,
                user: userRecord.rows[0],
                admin: adminResponse.rows[0],
                message: "Golffit admin has been registered successfully"
            })

    } catch (err) {
        await pool.query('ROLLBACK');
        sendJSONresponse(res, 400, {
            message: "Failed to register Golffit user",
            error: err.message || err,
        });
    }


}

module.exports.login = (req, res, next) => {
    if (!req.body.username || !req.body.password) {
        sendJSONresponse(res, 400, { "message": "Please fill in all required fields" })
        return
    }

    passport.authenticate('local', async function (err, user, info) {
        if (err) {
            sendJSONresponse(res, 400, err)
        }
        if (user) {
            console.log(user)

            const token = generateJwt(user)
            const response = {
                "token": token,
                "user": user
            }

            if (user.usertype === "ADMIN") {
                const admin = await pool.query("SELECT * FROM admin WHERE userId=$1", [user.userid])
                response.admin = admin.rows[0]
            } else if (user.usertype === "CUSTOMER") {
                const customer = await pool.query("SELECT * FROM customers WHERE userId=$1", [user.userid])
                response.customer = customer.rows[0]
            }

            sendJSONresponse(res, 200, response)
        } else {
            sendJSONresponse(res, 401, { "message": info.message || "authentication failed" })
        }

    })(req, res, next);
}

module.exports.getCustomerList = async (req, res) => {
    try {
        let { page, limit, search, sort } = req.query;


         const sortQuery = getSortQuery(sort)

         search = search ? search : ""

        let searchQuery = getSQLFilter(["firstName", "lastName", "email", "phoneNumber", "address", "gender", "golfClubSize"])

        const totalItems = parseInt((await pool.query(`SELECT COUNT(*) FROM customers WHERE ${searchQuery("$1")}`, [`%${search}%`])).rows[0].count);

        const {limitDefault, offset} = getPageOffset(page, limit, totalItems)
        limit = limit ? limit : limitDefault  
        const customerList = (await pool.query(`SELECT * FROM customers WHERE ${searchQuery("$3")} ${sortQuery} LIMIT $1::int OFFSET $2::int`, [limit, offset, `%${search}%`])).rows;

        const resultObj = {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            perPage: limit,
            searchQuery: search || "",
            data: customerList
        };

        sendJSONresponse(res, 200, resultObj);
    } catch (err) {
        console.error("Database Query Error:", err);
        sendJSONresponse(res, 500, { error: "Internal Server Error", details: err.message });
    }
};



module.exports.getOneCustomer = (req, res) => {
    const customerId = req.params.customerId

    pool.query("SELECT * FROM customers WHERE customerId=$1 ",
        [
            customerId
        ])
        .then((response) => {
            sendJSONresponse(res, 200, response.rows[0])
        }).catch((err) => {
            sendJSONresponse(res, 401, err)
        })
}

module.exports.deleteCustomer = (req, res) => {
    const customerId = req.params.customerId
    pool.query("DELETE FROM customers WHERE customerId=$1 ",
        [
            customerId
        ])
        .then((response) => {
            sendJSONresponse(res, 200, { message: "customer deleted" })
        }).catch((err) => {
            sendJSONresponse(res, 401, err)
        })
}

module.exports.updateCustomer = async (req, res) => {
    console.log("ndafika")
    const customerId = req.params.customerId
    if (!req.body.firstname || !req.body.lastname || !req.body.email) {
        return sendJSONresponse(res, 400, {
            message: "Fill in all required fields",
        });
    }

    const { firstname, lastname, email, address, phonenumber, gender, golfclubsize } = req.body;
    try {

        await pool.query("BEGIN")

        const user = await pool.query("SELECT userId FROM customers WHERE customerId = $1", [customerId])
        const userId = user.rows[0].userid
        // console.log(user.rows)
        const userUpdateQuery =
            `
            UPDATE users SET username = $1
            WHERE userId = $2
        `
        const userRecord = await pool.query(userUpdateQuery, [email, userId])

        const customerUpdateQuery =
            `
         UPDATE customers SET
         firstname = $1, lastname = $2, email = $3, phonenumber= $4, address = $5, gender = $6, golfclubsize = $7
         WHERE customerId = $8
        `
        await pool.query(customerUpdateQuery, [firstname, lastname, email, phonenumber, address, gender, golfclubsize, customerId])

        await pool.query("COMMIT")

        sendJSONresponse(res, 200, { "message": "Customer record updated successfully" })

    } catch (err) {
        await pool.query("ROLLBACK")
        sendJSONresponse(res, 400, { "message": "Failed to update customer record ", err })

    }

}

// module.exports.getCustomerProfile