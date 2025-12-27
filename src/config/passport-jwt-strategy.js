import UserModel from '../models/UserModel.js';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';

// Configure JWT strategy
var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_TOKEN_SECRET_KEY
}

const jwtStrategy = new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
        // Find user by id
        const user = await UserModel.getUserById(jwt_payload.id);

        // Check if user exists
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        console.error('Error finding user in JWT strategy:', error);
        return done(error, false);
    }
})

passport.use(jwtStrategy);
