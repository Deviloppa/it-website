
// Erstellen der Collection f�r die Tags
Tags = new Mongo.Collection("tags");

Tags.search = function(query) {
    /*if (_.isUndefined(query) || _.isEmpty(query) || _.isNull(query)) {
        return Tags.find({});
    } else {*/
        var regex = '/.*' + RegExp.escape(query) + '.*/i'; // i = keine Groß- und Kleinschreibung
        return Tags.find({
            "$or": [
                {"titel": {"$regex": regex}},
                {"description": {"$regex": regex}}
            ]
        }, {limit: 20});
    //}
};