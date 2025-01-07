const sendJSONresponse = require('../services/response' )
const{ setPassword,
    generateJwt,
    getUserByEmail} = require("../model/user");
const pool = require('../model/db');
const passport = require('passport');

module.exports.register =(req, res)=>{
    if (!req.body.name || !req.body.email || !req.body.password) {
        sendJSONresponse(res, 400, {
            message: "Fill in all required fields",
        });
    }

    const{name, email, password, address, phonenumber, golf_club_size} = req.body

    getUserByEmail(email).then((userExist)=>{
        if(userExist.length > 0){
            return sendJSONresponse(res, 400, {"message":"Email already in use with another customer"})
        }
    }).catch(()=>{
        console.log("Mwadutsa")
    })

     const{salt, hash} = setPassword(password)
     pool.query(
            `INSERT INTO users 
            (
            email,
            name, 
            address, 
            phonenumber, 
            golf_club_size,
            hash,
            salt
            )VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING userId, name, email, address, phonenumber, golf_club_size`,
            [
                email,
                name,
                address,
                phonenumber,
                golf_club_size,
                hash,
                salt
            ]
        ).then((response)=>{
            const user = response.rows[0]
            const token = generateJwt(user)
            sendJSONresponse(res, 201, {
                "token":token,
                "user":user,
                "message":"Golffit Customer registration is successful!"
            })
        }).catch((err)=>{
            if (!res.headersSent) {
                return sendJSONresponse(res, 400, {
                    message: "Failed to register customer",
                    error: err.message || err
                });
            }
        })
}

module.exports.login = (req, res, next)=>{
    if(!req.body.email || !req.body.password){
        sendJSONresponse(res, 400, {"message":"Please fill in all required fields"})
        return
    }

    passport.authenticate('local', function(err, user, info){
        if(err){
            sendJSONresponse(res, 400, err)
        }
        if(user){
            const token =  generateJwt(user)
            sendJSONresponse(res, 200, {
                "token": token,
                "user":user
            }) 
        }else{
           sendJSONresponse(res, 401, {"message":info.message || "authentication failed"})
        }

    })(req, res, next);
}

