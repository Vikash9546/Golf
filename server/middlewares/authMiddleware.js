import jwt from 'jsonwebtoken';

// Authenticate the user by verifying the JWT
export const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            // Decode and verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Attach the id and role directly to the request object (e.g., {id: '...', role: 'ADMIN'})
            req.user = decoded; 
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Enforce specific roles (e.g., authorize('ADMIN', 'SUPERUSER'))
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden: Access restricted to ${roles.join(' or ')} role(s)` 
            });
        }
        next();
    };
};

// Shortcut for admin-only protection
export const admin = authorize('ADMIN');
