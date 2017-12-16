var mongoose = require("mongoose");

var blogSchema = new mongoose.Schema({
    title: String,
    image: String, //{ type: String, default: placeholder.jpg }
    body: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
    },
    created: { type: Date, default: Date.now } //default value for date
});

module.exports = mongoose.model("Blog",blogSchema);
