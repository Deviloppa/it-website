// Erstellen der Collection f�r die Tags
Tags = new Mongo.Collection("tags");

Tags.search = function (query) {
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


var createThumb = function(fileObj, readStream, writeStream) {
    gm(readStream, fileObj.name()).resize('300', '300').stream().pipe(writeStream);
};

var imageStore = new FS.Store.GridFS("images", {});
var thumbStore = new FS.Store.GridFS("thumbs", {transformWrite: createThumb});

Images = new FS.Collection("images", {
    stores: [imageStore, thumbStore],
    filter: {
        allow: { contentTypes: ['image/*'] }
    }
});