// Erstellen der Collection für die Tags
Tags = new Mongo.Collection("tags");

//Das Hochgeladene Bild auf 300x300 pixel zuschneiden für die Vorschau
var createThumb = function(fileObj, readStream, writeStream) {
    gm(readStream, fileObj.name()).resize('300', '300').stream().pipe(writeStream);
};

var imageStore = new FS.Store.GridFS("images", {});
var thumbStore = new FS.Store.GridFS("thumbs", {transformWrite: createThumb});

//Erstellen der Collection für die Bilder und nur Daten vom Type image zulessen
Images = new FS.Collection("images", {
    stores: [imageStore, thumbStore],
    filter: {
        allow: { contentTypes: ['image/*'] }
    }
});

//Den eingegeben Suchbegriff auf einen Regex überprüfen und falls nötig veränden
RegExp.escape = function(s) {
    if (_.isString(s)) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    } else {
        return  "";
    }
};