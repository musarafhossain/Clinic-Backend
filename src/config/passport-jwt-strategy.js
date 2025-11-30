import UserModel from '../models/UserModel.js';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';

var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_TOKEN_SECRET_KEY
}

passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
        const user = await UserModel.getUserById(jwt_payload.id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        console.error('Error finding user in JWT strategy:', error);
        return done(error, false);
    }
}));
