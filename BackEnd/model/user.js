var db = require('./databaseConfig.js');
var config = require('../config.js');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var userDB = {

	loginUser: function (email, password, callback) {

		var conn = db.getConnection();

		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			}
			else {
				console.log("Connected!");


				var sql = 'select * from users where email = ?';
				conn.query(sql, [email], function (err, result) { // retrieves entry with corresponding email address
					conn.end();

					if (err) {
						console.log("Err: " + err);
						return callback(err, null, null);

					} else {
						var token = "";

						var err2 = new Error("Email/Password does not match."); // in case of an error
						err2.statusCode = 404;

						if (result.length == 1) {
							if (bcrypt.compareSync(password, result[0].password)) {
								token = jwt.sign({ id: result[0].id }, config.key, {
									expiresIn: 86400 //expires in 24 hrs
								});
								console.log("@@token " + token);
								return callback(null, token, result);

							} else {
								console.log("email/password does not match");
								console.log(err2);
								return callback(err2, null, null);
							}


						} //if(res)
						else {
							console.log("email/password does not match");
							console.log(err2);
							return callback(err2, null, null);
						}
					}  //else
				});
			}
		});
	},

	updateUser: function (username, firstname, lastname, id, callback) {

		var conn = db.getConnection();
		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} else {
				console.log("Connected!");

				var sql = "update users set username = ?,firstname = ?,lastname = ? where id = ?;";

				conn.query(sql, [username, firstname, lastname, id], function (err, result) {
					conn.end();

					if (err) {
						console.log(err);
						return callback(err, null);
					} else {
						console.log("No. of records updated successfully: " + result.affectedRows);
						return callback(null, result.affectedRows);
					}
				})
			}
		})
	},

	addUser: function (username, email, password, profile_pic_url, role, callback) {

		var conn = db.getConnection();

		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} else {


				console.log("Connected!");
				var sql = "Insert into users(username,email,password,profile_pic_url,role) values(?,?,?,?,?)";
				conn.query(sql, [username, email, password, profile_pic_url, role], function (err, result) {
					conn.end();

					if (err) {
						console.log(err);
						return callback(err, null);
					} else {
						return callback(null, result);
					}
				});

			}
		});
	},
	logoutUser: function (token, expiry, callback) {
		var conn = db.getConnection();

		conn.connect(function (err) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} else {

				console.log("Connected!");
				var sql = "Insert into tokenblacklist (token, expiry_date) values (?,?)";
				conn.query(sql, [token, expiry], function (err, result) {
					conn.end();

					if (err) {
						console.log(err);
						return callback(err, null);
					} else {
						return callback(null, result);
					}
				});

			}
		});
	}
};


module.exports = userDB;