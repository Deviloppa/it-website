/**
 * Created by Daniel on 11.03.2016.
 */
Meteor.startup(function () {
    Tags._ensureIndex({latLng: "2dsphere"});
});

Images.allow({
    'insert': function() {
        //TODO: Check if authenticated
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

Meteor.publish('photo', function(photoId) {
    if (photoId == null) return;
    if (_.isUndefined(photoId)) return;
    check(photoId, String);

    return Images.find(photoId);
});


Meteor.methods({

    deleteTag: function (tagID) {

        check(tagID, String);

        var tag = Tags.findOne(tagID);
        if (tag.owner !== Meteor.userId()) {
            // If the task is private, make sure only the owner can delete it
            throw new Meteor.Error("not-authorized");
        }

        Tags.remove(tagID); //TODO: Check owner
    },


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

        var cb = function(fileObj) {
            // Insert a task into the collection
            Tags.insert({
                titel: _titel,
                createdAt: new Date(),            // current time
                owner: Meteor.userId(),           // _id of logged in user
                username: Meteor.user().username,  // username of logged in user
                description: _des,
                image: fileObj._id,
                latLng: latLng
            }, function(err, _id) {

            });
        };

        if (!_.isUndefined(_image) && !_.isNull(_image) && _.has(_image, '_id')) {
            console.log('has images');
            cb(_image);
        } else {
            console.log('has no images');
            cb({_id: null});
        }

    }
});