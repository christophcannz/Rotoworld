var schema = mongoose.Schema;
var ArticleSchema = new Schema({
    
    title: {
        type: String,
        required: true
    },

    note: {
        type: String,
        required: true
    },

    note: {
        type: Schema.Types.ObjectID,
        ref: "Note"
    }
});

var Article = mongoose.model("Article", ArticleScema);

module.exports = Article;