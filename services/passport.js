const passport = require("passport");
const flash = require("express-flash");
const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("../config/dbConfig");
const bcrypt = require("bcrypt");

function initializePassport(passport) {
  const authenticateUser = (email, password, done) => {
    pool.query(
      `SELECT * FROM autenticaciones WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }

        console.log(results.rows);

        if (results.rows.length > 0) {
          const user = results.rows[0];
          console.log(password, user.password);
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
              throw err;
            }
            console.log(isMatch);
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, {
                message: "La contraseña es incorrecta",
              });
            }
          });
        } else {
          return done(null, false, {
            message: "Correo electronico no registrado",
          });
        }
      }
    );
  };

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => done(null, user.id_autenticacion));

  passport.deserializeUser((id, done) => {
    pool.query(
      `SELECT * FROM autenticaciones WHERE id_autenticacion = $1`,
      [id],
      (err, results) => {
        if (err) {
          throw err;
        }
        return done(null, results.rows[0]);
      }
    );
  });
}

initializePassport(passport);

module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
};
