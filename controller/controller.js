var express = require("express");
var router = express.Router();
var path = require("path");

//var request = require("request");
var cheerio = require("cheerio");

var note = require("../models/Note.js");
var article = require("../models/article.js")

router.get("/", function (req, res) {
    res.redirect("/articles");
});

router.get("/scrape", function (req, res) {
    request("http://www.rotoworld.com", function (error, response, html) {
        var $ = cheerio.load(html);
        var titlesArray = [];

        $(".c-entry-box--compact__title").each(function (i, element) {
            var result = {};

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            if (result.title !== "" && result.link !== "") {
                if (titlesArray.indexOf(result.title) == -1) {
                    titlesArray.push(result.title);

                    article.count({ title: result.title }, function (err, test) {
                        if (test === 0) {
                            var entry = new article(result);

                            entry.save(function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(doc);
                                }
                            });
                        }
                    });
                } else {
                    console.log("Already Scraped");
                }
            } else {
                console.log("missing data");
            }
        });
        res.redirect("/");
    });
});
router.get("/articles", function (req, res) {
    article.find()
        .sort({ _id: -1 })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                var artcl = { article: doc };
                res.render("index", artcl);
            }
        });
});

router.get("/articles-json", function (req, res) {
    article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

router.get("/clearAll", function (req, res) {
    article.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("Atricles Deleted");
        }
    });
    res.redirect("/articles-json");
});

router.get("/readArticle/:id", function (req, res) {
    var articleId = req.params.id;
    var hbsObj = {
        article: [],
        body: []

    };
    article.findOne({ _id: articleId })
        .populate("Note")
        .exec(function (err, doc) {
            if (err) {
                console.log("Error: " + err);
            } else {
                hbsObj.article = doc;
                var link = doc.link;
                request(link, function (error, response, html) {
                    var $ = cheerio.load(html);

                    $(".1-col__main").each(function (i, element) {
                        hbsObj.body = $(this)
                            .children(".c-entry-content")
                            .children("p")
                            .text();

                        res.render("article", hbsObj);
                        return false;
                    });
                });
            }
        });
});

router.post("/note/:id", function (req, res) {
    var user = req.body.name;
    var content = req.body.note;
    var articleId = req.params.id;

    var noteObj = {
        name: user,
        body: content
    };

    var newNote = new Note(noteObj);

    newNote.save(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log(doc._id);
            console.log(articleId);

            article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { note: doc._id } },
                { new: true }
            ).exec(function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/readArticle/" + articleId);
                }
            });
        }
    });
});

module.exports = router;