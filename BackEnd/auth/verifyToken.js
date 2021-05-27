
var jwt = require('jsonwebtoken');
var config = require('../config');

var db = require('../model/databaseConfig'); // In order to connect the database

function verifyToken(req, res, next) {

    var token = req.headers['authorization']; //retrieve authorization header's content

    if (!token || !token.includes('Bearer')) {

        res.status(403);
        return res.send({ auth: 'false', message: 'Not authorized!' });
    } else {

        token = token.split('Bearer ')[1]; //obtain the token's value
        jwt.verify(token, config.key, function (err, decoded) { //verify token
            if (err) {
                res.status(403);
                return res.end({ auth: false, message: 'Not authorized!' });

            } else {
                var conn = db.getConnection();
                conn.connect(function (err) {
                    if (err) {
                        console.log(err);
                        res.status(500);
                        res.json({ success: false })
                    } else {
                        console.log("Connected!");
                        var sql = "SELECT * FROM tokenblacklist WHERE token = ? ";
                        conn.query(sql, [token], function (err, result) {
                            conn.end();
                            console.log(result);
                            if (err) {
                                console.log(err);
                                res.status(500);
                                res.json({ success: false })

                            } else {
                                if (result.length > 0) {
                                    res.status(403);
                                    return res.end('Not authorized!');
                                } else {
                                    req.id = decoded.id
                                    next();
                                }
                            }
                        });
                    }
                });
            }
        });
    }
}

module.exports = verifyToken;