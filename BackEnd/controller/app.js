var jwt = require('jsonwebtoken'); // for token decoding
var config = require('../config');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var user = require('../model/user.js');
var listing = require('../model/listing');
var offers = require('../model/offer');
var likes = require('../model/likes');
var images = require('../model/images')
var verifyToken = require('../auth/verifyToken.js');

var path = require("path");
var multer = require('multer')

var cors = require('cors');//Just use(security feature)

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var validator = require('validator');
var validateFn = require('../model/validation.js');
const bcrypt = require('bcrypt');
const saltRounds = 12;

app.options('*', cors());//Just use
app.use(cors());//Just use
app.use(bodyParser.json());
app.use(urlencodedParser);

var ExpressBrute = require('express-brute');
var SequelizeStore = require('express-brute-sequelize');
var Sequelize = require('sequelize');

var sequelize = new Sequelize('snapsell', 'Ben', '!QWER4321', {
	host: "3.132.36.162",
	dialect: "mysql",
	logging: false,
});


var handleStoreError = function (error) {
	console.log(error); // log this error so we can figure out what went wrong
	throw {
		message: error.message,
		parent: error.parent
	};
}


//User APIs
new SequelizeStore(sequelize, 'bruteStore', {}, function (store) {
	var bruteforce = new ExpressBrute(store, {
		freeRetries: 5, // Number of tries until cooldown starts
		minWait: 30000, // Initial cooldown of 30 seconds (in milliseconds)
		maxWait: 1800000, // Max cooldown of 30 minutes (in milliseconds)
		failCallback: ExpressBrute.FailTooManyRequests, // if too many failed requests occur
		handleStoreError: handleStoreError
	});
	app.post('/user/login', bruteforce.prevent, function (req, res) {//Login
		var email = req.body.email;
		var password = req.body.password;

		user.loginUser(email, password, function (err, token, result) {
			if (err) {
				res.status(500);
				res.send(err.statusCode);
			} else {
				req.brute.reset(); // Resets failure counter to 0 after a successful login attempt
				res.statusCode = 201;
				res.setHeader('Content-Type', 'application/json');
				delete result[0]['password'];//clear the password in json data, do not send back to client
				res.json({ success: true, UserData: JSON.stringify(result), token: token, status: 'You are successfully logged in!' });
			}
		});
	});
});

app.post('/user', function (req, res) {//Create User
	
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var profile_pic_url = req.body.profile_pic_url;
	var role = req.body.role;
	
	if (validator.isStrongPassword(password, {
		minLength: 8, 
		minLowercase: 1, 
		minUppercase: 1,
		minNumbers: 1, 
		minSymbols: 1, 
		returnScore: false
	})) {
		bcrypt.genSalt(saltRounds, function (err, salt) { // Generates a salt for the password
			if (err) {
				throw err;
			} else {
				console.log("salt:", salt); // prints salt for debugging
				bcrypt.hash(password, salt, function (err, hash) {
					if (err) {
						throw err;
					} else {
						console.log('hash:', hash); // prints hash for debugging
						user.addUser(username, email, hash, profile_pic_url, role, function (err, result) {
							// passes in hash and salt values for placement in database
							if (err) {
								res.status(500);
								res.send(err);
							} else {
								res.status(201);
								res.setHeader('Content-Type', 'application/json');
								res.send(result);
							}
						});
					}
				})
			}
		})
	} else {
		res.status(400); // bad request
		res.send("Password must be 8 characters in length, at least 1 lowercase, uppercase, number and symbol each!");
	}


});

app.post('/user/logout', function (req, res) {//Logout
	console.log("..logging out.");

	var token = req.headers['authorization'];
	token = token.split('Bearer ')[1]; //obtain the token's value
	jwt.verify(token, config.key, function (err, decoded) { //verify token
		if (err) {
			res.status(403);
			return res.end({ auth: false, message: 'Not authorized!' });
		} else {

			var expiryDate = new Date(decoded.exp * 1000); // converts expiration time to seconds and creates a new date object
			user.logoutUser(token, expiryDate, (err, result) => {
				if (err) {
					res.status(500);
					res.json({ success: false })
				} else {
					res.clearCookie('session-id'); //clears the cookie in the response
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: true, status: 'Log out successful!' });
				}
			})

		}
	});

});


app.put('/user/update/', verifyToken, function (req, res) {//Update user info
	var id = req.id
	var username = req.body.username;
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	user.updateUser(username, firstname, lastname, id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

//Listing APIs
app.post('/listing/', validateFn.validateListing, verifyToken, function (req, res) {//Add Listing
	var title = req.body.title;
	var category = req.body.category;
	var description = req.body.description;
	var price = req.body.price;
	var fk_poster_id = req.id;
	listing.addListing(title, category, description, price, fk_poster_id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false });
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true,id:result.insertId })
		}
	});
});


app.get('/user/listing', verifyToken, function (req, res) {//Get all Listings of the User
	var userid = req.id;
	listing.getUserListings(userid, function (err, result) {
		if (err) {
			res.status(500);
			console.log(err)
			res.json({ success: false });
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result });
		}
	});
});

app.get('/listing/:id', function (req, res) {//View a listing
	var id = req.params.id
	listing.getListing(id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result })
		}
	});
});

app.get('/search/:query', validateFn.validateSearch, verifyToken, function (req, res) {//View all other user's listing that matches the search
	var query = req.params.query;
	var userid = req.id;
	listing.getOtherUsersListings(query, userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			result = validateFn.sanitizeResult(result);
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result })
		}
	});
});

app.put('/listing/update/', verifyToken, function (req, res) {//View a listing
	var title = req.body.title;
	var category = req.body.category;
	var description = req.body.description;
	var price = req.body.price;
	var id = req.body.id;
	var userid = req.id;
	listing.updateListing(title, category, description, price, id, userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.delete('/listing/delete/', verifyToken, function (req, res) {//View a listing
	var id = req.body.id;
	var userid = req.id;
	listing.deleteListing(id, userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

//Offers API
app.post('/offer/', verifyToken, function (req, res) {//View a listing
	var offer = req.body.offer;
	var fk_listing_id = req.body.fk_listing_id;
	var fk_offeror_id = req.id;
	var status = "pending";
	offers.addOffer(offer, fk_listing_id, fk_offeror_id, status, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.get('/offer/', verifyToken, function (req, res) {//View all offers
	var userid = req.id
	offers.getOffers(userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			console.log(result)
			res.json({ success: true, result: result })
		}
	});
});

app.post('/offer/decision/', verifyToken, function (req, res) {//View all offers
	var status = req.body.status;
	var offerid = req.body.offerid;
	var userid = req.id;
	offers.AcceptOrRejectOffer(status, offerid,userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.get('/offer/status/', verifyToken, function (req, res) {//View all offers
	var userid = req.id
	offers.getOfferStatus(userid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, result: result })
		}
	});
});

//Likes API
app.post('/likes/', verifyToken, function (req, res) {//View all offers
	var userid = req.id
	var listingid = req.body.listingid;
	likes.insertLike(userid, listingid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(201);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true })
		}
	});
});

app.get('/likeorunlike/:listingid/', verifyToken, function (req, res) {//Like or Unlike
	var userid = req.id
	var listingid = req.params.listingid;
	likes.checklike(userid, listingid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			if (result.length == 0) {
				likes.insertLike(userid, listingid, function (err, result) {
					if (err) {
						res.status(500);
						res.json({ success: false })
					} else {
						res.status(201);
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: true, action: "liked" })
					}
				});
			} else {
				likes.deleteLike(userid, listingid, function (err, result) {
					if (err) {
						res.status(500);
						res.json({ success: false })
					} else {
						res.status(200);
						res.json({ success: true, action: "unliked" })
					}
				});
			}
		}
	});
});

app.get('/likes/:listingid/', function (req, res) {//View all offers
	var listingid = req.params.listingid;
	likes.getLike(listingid, function (err, result) {
		if (err) {
			res.status(500);
			res.json({ success: false })
		} else {
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.json({ success: true, amount: result.length })
		}
	});
});

//Images API

let storage = multer.diskStorage({
	destination: function (req, file, callback) {

		callback(null, __dirname + "/../public")
	},
	filename: function (req, file, cb) {
		req.filename = file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + path.extname(file.originalname);
		cb(null, req.filename);
		
	}
});

let upload = multer({
	storage: storage, limits: { fileSize: 5 * 1024 * 1024 }
});//limits check if he file size is equal to or below 5mb


app.post('/images/:fk_product_id/', upload.single('myfile'), function (req, res) {
	var fk_product_id = req.params.fk_product_id;
	var name = req.filename;
	images.uploadImage(name,fk_product_id, function (err, result) {
		if (err) {
			res.status(500);
			res.json({success:false});
		} else {
			res.status(201);
			res.json({success:true});
		}
	});
});
module.exports = app;