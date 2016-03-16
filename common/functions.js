// Erstellen der Collection für die Tags
Tags = new Mongo.Collection("tags");

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

RegExp.escape = function(s) {
    if (_.isString(s)) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    } else {
        return  "";
    }
};