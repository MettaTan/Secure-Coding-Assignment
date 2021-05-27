

var mysql = require('mysql');

var dbconnect = {
getConnection: function() {
    var conn = mysql.createConnection({
    host: "3.132.36.162",
    user: "Metta",
    password: "!QWER4321",
    database: "snapsell"
});
return conn;
}
};

module.exports = dbconnect