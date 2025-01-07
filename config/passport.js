const passport = require("passport")
const LocalStrategy =  require("passport-local").Strategy
const{getUserByEmail, validPassword} = require("../model/user")

passport.use(new LocalStrategy(
    {
        usernameField:"email"
    },

     function(username, password, done){
         getUserByEmail(username)
         .then((response)=>{
            const user = response[0]
            if(!user){
                return done(null, false, {
                    message:"Incorrect username"
                })
            }

            if(!validPassword(user, password)){
                return done(null, false, {
                    message: "Incorrect password",
                });
            }
            return done(null, user);

         }).catch((err)=>{
            return done(err)
         })
          
    }
))