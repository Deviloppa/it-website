/**
 * Created by Daniel on 11.03.2016.
 */
Meteor.startup(function () {
    Tags._ensureIndex({latLng: "2dsphere"});
});

//Direkte Zugriff erlauben von der Clientseite aus für die Bilder
Images.allow({
    'insert': function() {
        return true;
    },
    'update': function() {
        return true;
    },
    'download': function(userId, fileObj) {
        console.log('download');
        return true;
    }
});

/*
Liefert die entsprechenden Tags mit dem passenden Suchtext und / oder dem ausgewählten Radius zurück
Überpüft auch alle Variablen welchen vom Client an den Sevrer gesendet werden
*/
Meteor.publish('tags', function(_regex, _lng, _lat, _radius) {

    var query = {};

    if (!_.isUndefined(_regex) && !_.isNull(_regex)) {
        check(_regex, String);
        var regex = RegExp.escape(_regex);
        regex = new RegExp(regex, 'i');

        query['$or'] = [
            {"titel": regex},
            {"description": regex},
            {"username": regex}
        ];
    }

    if (_.isUndefined(_radius) || _.isNull(_radius) ||
        !_.isFinite(_radius)) {
        console.log("Invalid radius " + _radius + ". Resetting to 50");
        _radius = 50;
    } else {
        _radius = parseInt(_radius);
        if (_radius < 1 || _radius > 5000) {
            console.log("Radius " + _radius + " too big/small. Resetting to 50");
            _radius = 50;
        }
    }

    if (!_.isUndefined(_lng) && !_.isUndefined(_lat) &&
        !_.isNull(_lng) && !_.isNull(_lat)) {

        check(_lng, Number);
        check(_lat, Number);

        query['latLng'] = {
            $near: {
                $geometry: {
                    type: 'Point', coordinates: [_lng, _lat]
                },
                $maxDistance: _radius
            }
        };
    }

    return [
        Tags.find(query, {limit: 100})
    ];
});

/*
 Liefert die Bilder zurück
 Überpüft auch alle Variablen welchen vom Client an den Sevrer gesendet werden
 */

Meteor.publish('photo', function(photoId) {
    if (photoId == null) return;
    if (_.isUndefined(photoId)) return;
    check(photoId, String);

    return Images.find(photoId);
});


Meteor.methods({

    /*
     Löschen eines Tags
     Überpüft auch alle Variablen welchen vom Client an den Sevrer gesendet werden und überprüft auch ob
     der Tag auch tatsächlich dem Benutzer gehört
     */
    deleteTag: function (tagID) {

        check(tagID, String);

        var tag = Tags.findOne(tagID);
        if (tag.owner !== Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        Tags.remove(tagID); //TODO: Check owner
    },

    /*
     Eintragen eines neuen Tags
     Überpüft auch alle Variablen welchen vom Client an den Sevrer gesendet werden
     Sollte der Benutzer ein Bild und ein Foto gleichzeitig versuchen hochzuladen wird jedoch nur das
     Bild hochgeladen das es eine Reihenfolge beim Upload gibt
     */
    addTag: function (_titel, _des, _latLng, _image, _coords) {

        check(_titel, String);
        check(_des, String);

        check(_latLng, {
            lat: Number,
            lng: Number
        });
        check(_image, Match.Any);
        check(_coords, Match.Any);


        if (_.isUndefined(_coords) || _.isNull(_coords) || _coords == "" || _coords.length < 3) {
            var latLng = {
                type: "Point",
                "coordinates": [
                    _latLng.lng,
                    _latLng.lat
                ]
            };
        } else {
            var coords = _coords.split(" ");
            var latLng = {
                type: "Point",
                "coordinates": [
                    parseFloat(coords[1]),
                    parseFloat(coords[0])
                ]
            };
        }

        Future = Npm.require('fibers/future');
        var future = new Future();

        // Insert a task into the collection
        Tags.insert({
            titel: _titel,
            createdAt: new Date(),            // current time
            owner: Meteor.userId(),           // _id of logged in user
            username: Meteor.user().username,  // username of logged in user
            description: _des,
            latLng: latLng
        }, function(err, tag_id) {
            if (err) {
                return future.throw(err);
            }
            if (!_.isUndefined(_image) && !_.isNull(_image) && _.has(_image, '_id')) {
                console.log('has images');
                Tags.update(tag_id, {
                    $set: {image: _image._id}
                }, function(err, cnt) {
                    if(err) {
                        return future.throw(err);
                    }
                    future.return();
                });
            } else if (!_.isUndefined(_image) && !_.isNull(_image) && _image.indexOf(';base64') > 0) {
                // Base64 encoded image
                console.log('base64 image');
                var fsFile = new FS.File();
                fsFile.attachData(_image, function(err) {
                    if(err) {
                        return future.throw(err);
                    }
                    Images.insert(fsFile, function(err, fileObj) {
                        if (err) {
                            return future.throw(err);
                        }
                        Tags.update(tag_id, {
                            $set: {image: fileObj._id}
                        }, function(err, cnt) {
                            if(err) {
                                return future.throw(err);
                            }
                            future.return();
                        });
                    });
                })

            } else {
                console.log('has no images');
                future.return();
            }
        });
        return future.wait();
    }
});