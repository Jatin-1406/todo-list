import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            console.log('Attempting to authenticate:', email); // Debug entry point
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            console.log('Query result:', result.rows); // Debug query result
            if (result.rows.length === 0) {
                console.log('Unregistered email attempted:', email);
                return done(null, false, { message: `Unregistered email attempted: ${email}. Please register yourself first.` });
            }
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: 'Incorrect password' });
            }
            return done(null, user);
        } catch (err) {
            console.error('Authentication error:', err);
            return done(err);
        }
    }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.email]);
        if (result.rows.length > 0) {
            return done(null, result.rows[0]);
        }
        const newUser = await pool.query(
            'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING *',
            [profile.email, profile.id]
        );
        return done(null, newUser.rows[0]);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

export default passport;