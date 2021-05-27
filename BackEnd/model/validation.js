var validator = require('validator');
var validationFn = {

    validateListing: function (req,res,next) {
        var title = req.body.title
        var category = req.body.category
        var description = req.body.description
        var price = req.body.price

        var titlecatpattern = new RegExp("^[a-zA-Z\\d\\s\\.,\\-\\(\\)]+$") //^[a-zA-Z\\d\\s\\.,\\-\\(\\)]+$
        var descpattern = new RegExp("^[a-zA-Z\\d\\s\\.,]+$")
        var pricepattern = new RegExp("^[\\d\\s\\.]+$")

        if (titlecatpattern.test(title) && titlecatpattern.test(category) && descpattern.test(description) && pricepattern.test(price)) {
            next();
        } else {
            res.status(500)
            res.send(`{message: 'Input contains contains invalid characters!'}`)
        }
    },

    sanitizeResult: function (result) {
        for (var i = 0; i < result.length; i++) {
            var row = result[i];
            for (var key in row){
                value = row[key];
                if (typeof value === "string"){
                    row[key] = validator.escape(value)
                }
            }
        }
        return result;
    },

    validateSearch: function (req,res,next) {
        var query = req.params.query;

        var searchpattern = new RegExp("^[a-zA-Z\\d\\s\\.,\\-\\(\\)]+$")
        if (searchpattern.test(query)) {
            next();
        } else {
            res.status(500)
            res.send(`{message: 'Input contains contains invalid characters!'}`)
        }


    }


}

module.exports = validationFn;