import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/user.js';

passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
        const usuario = await User.findOne({ where: { email } });

        if (!usuario) {
            return done(null, false, { message: "Credenciales incorrectas" });
        }

        if (!usuario.password) {
            return done(null, false, { 
                message: "Verifica tu método de inicio de sesión. Si te registraste con Google o Microsoft, usa ese método para acceder."
            });
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return done(null, false, { message: "Credenciales incorrectas" });
        }
        return done(null, usuario);
    } catch (error) {
        return done(error);
    }
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ where: { email: profile.emails[0].value } });

        if (!user) {
            user = await User.create({
                nombre: profile.displayName,
                email: profile.emails[0].value,
                password: null, 
                id_rol: process.env.ROL_USER 
            });

            user = await User.findOne({ where: { email: profile.emails[0].value } });
        }

        if (!user || !user.id_usuario) {
            return done(new Error("El usuario no tiene un ID válido después de Google Auth"));
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/microsoft/callback",
    scope: ["openid", "User.Read", "offline_access"],
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ where: { email: profile.emails[0].value } });

        if (!user) {
            user = await User.create({
                nombre: profile.displayName,
                email: profile.emails[0].value,
                password: null, 
                id_rol: process.env.ROL_USER 
            });

            user = await User.findOne({ where: { email: profile.emails[0].value } });
        }


        if (!user || !user.id_usuario) {
            return done(new Error("El usuario no tiene un ID válido después de Microsoft Auth"));
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    if (!user || !user.id_usuario) {
        return done(new Error("El usuario no tiene un ID válido"));
    }
    done(null, user.id_usuario);
});

passport.deserializeUser(async (id, done) => {
    try {
        const usuario = await User.findByPk(id);
        if (!usuario) {
            return done(null, false);
        }
        done(null, usuario);
    } catch (error) {
        done(error);
    }
});

export default passport;
