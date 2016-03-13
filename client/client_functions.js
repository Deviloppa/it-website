// Konstanten
var TEST_COUNTER = 5; // Counter für Testzwecke, um verschiedene GPS Werte zu bekommen
var mapMarkers = {};

var mapCircle = null;


Meteor.startup(function () {
    Session.set('mapRadius', 50);
    Session.set('mapZoom', 17);
    GoogleMaps.load({key: "AIzaSyDvBFP1IP6DrciCJMmtQPft6bt08xiaaI8", libraries: 'geometry,drawing,places'});
});

Template.registerHelper('Session', function (param) {
    return Session.get(param);
});
Template.registerHelper('formatDate', function (date) {
    return moment(date).format('DD MM YYYY HH:mm:ss');
});
Template.registerHelper('Image', function (id) {
    return Images.findOne(id);
});

Template.registerHelper('tags', function () {
    /*
     var currentTags = Session.get('currentTags');
     console.log(currentTags);
     if (_.isUndefined(currentTags) || currentTags === null) {
     console.log('default');
     return Tags.find({});
     } else {
     return currentTags;
     }*/

    //return Tags.search(Session.get('searchQuery'));
    return Tags.find({});

});

Template.registerHelper('formatDesc', function (description) {
    var n = 40;
    var isTooLong = description.length > n;
    var s_ = isTooLong ? description.substr(0, n - 1) : description;                   //trinitätsoperator
    s_ = (isTooLong) ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
    return isTooLong ? s_ + '...' : s_;
});

Template.registerHelper('formatGps', function(latLng) {
    if (!_.isUndefined(latLng) && !_.isNull(latLng) && _.has(latLng, 'lat') && _.has(latLng, 'lng')) {
        return latLng.lat + ", " + latLng.lng;
    }
    return "-";
});

Template.body.onCreated(function () {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('map', function (map) {
        // Add a marker to the map once it's ready
        var marker = new google.maps.Marker({
            position: map.options.center,
            map: map.instance
        });


        Tracker.autorun(function() {
            if (!_.isNull(mapCircle)) {
                mapCircle.setMap(null);
            }
            mapCircle = new google.maps.Circle({
                strokeColor: '#BDBDBD',
                strokeOpacity: 0.4,
                strokeWeight: 2,
                fillColor: '#BDBDBD',
                fillOpacity: 0.4,
                radius: Session.get('mapRadius'),
                center: map.options.center,
                map: map.instance
            });
            map.instance.setZoom(Session.get('mapZoom'));
            map.instance.setCenter(map.options.center);
        });

        Tags.find({}).observe({
            added: function (document) {
                mapMarkers[document._id] = null;
                window.setTimeout(function () {
                    var tagMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(document.latLng.lat, document.latLng.lng),
                        map: map.instance,
                        animation: google.maps.Animation.DROP,
                        icon: new google.maps.MarkerImage("http://maps.google.com/mapfiles/ms/icons/blue.png"),
                        id: document._id
                    });
                    google.maps.event.addListener(tagMarker, 'click', function (event) {
                        var tag = Tags.findOne(tagMarker.id);
                        Session.set('currentTag', tag);
                    });


                    mapMarkers[document._id] = tagMarker;
                }, 200 * _.keys(mapMarkers).length)
            },
            changed: function (newDocument, oldDocument) {
                mapMarkers[newDocument._id].setPosition({lat: newDocument.position1, lng: newDocument.position2});
            },
            removed: function (oldDocument) {
                mapMarkers[oldDocument._id].setMap(null);

                google.maps.event.clearInstanceListeners(
                    mapMarkers[oldDocument._id]
                );

                // Remove the reference to this marker instance
                delete mapMarkers[oldDocument._id];
            }
        });

    });
});

Template.map.helpers({
    geoLocationMapOptions: function () {
        // Geolocation
        var latLng = Geolocation.latLng();
        console.log(Geolocation.currentLocation());
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded() && latLng) {
            // Map initialization options
            return {
                center: new google.maps.LatLng(latLng.lat, latLng.lng),
                zoom:  17
            };
        }
    }
});

Template.body.events({
    "click .previewMap": function (event) {
        // Prevent default browser form submit
        event.preventDefault();
        console.log("clicked");
        var tag_id = $(event.currentTarget).data('id');
        var tag = Tags.findOne(tag_id);

        Session.set('currentTag', tag);
    },

    "click .delete": function () {
        Tags.remove(this._id);
    }
});

Template.body.helpers({
    isOwner: function () {
        return this.owner === Meteor.userId();
    }
});

Template.addTag_Modal.events({
    "submit #addTag_Modal_Form": function (event) {
        event.preventDefault();

        console.log("add tag submit event");

        var titel = event.target.titel.value;
        var desc = event.target.description.value;
        var latLng = Geolocation.latLng();

        var files = event.target.file.files;
        if (files.length == 0) {
            Tags.insert({
                titel: titel,
                createdAt: new Date(),            // current time
                owner: Meteor.userId(),           // _id of logged in user
                username: Meteor.user().username,  // username of logged in user
                description: desc,
                image: "none",
                latLng: latLng
            });
        } else {
          for (var i = 0, ln = files.length; i < ln; i++) {
              Images.insert(files[i], function (err, fileObj) {

                  // Insert a task into the collection
                  Tags.insert({
                      titel: titel,
                      createdAt: new Date(),            // current time
                      owner: Meteor.userId(),           // _id of logged in user
                      username: Meteor.user().username,  // username of logged in user
                      description: desc,
                      image: fileObj._id,
                      latLng: latLng
                  });
              });
          }
        }

        // Clear form
        event.target.titel.value = "";
        event.target.description.value = "";

        $('#addTag_Modal').modal('hide');
    }
});

Template.addTag_Modal.helpers({
    'gpsCords': function () {
        return Geolocation.latLng();
    },
    'datum': function() {
        return new Date();
    }
});

Template.navbar.events({
    "click #logout": function (event) {
        event.preventDefault();
        Meteor.logout();
    },

    // Sucheingabe in der Navbar
    /*   "submit": function(event){
     event.preventDefault();
     console.log("Navbar klick");
     var input = event.target.inputSearch.value;
     if (input.trim().length == 0) {
     Session.set('currentTags', null);
     return;
     }

     // http://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
     // Sichert Eingabe ab
     input = input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
     var regex = '/.*' + input + '.* /i'; // i = keine Groß- und Kleinschreibung
     var tags = Tags.find({
     "$or": [
     {"titel": { "$regex": regex}},
     {"description": { "$regex": regex}}
     ]
     }).fetch();
     Session.set('currentTags', tags);
     console.log(tags);
     return tags;
     }*/
    /*'keyup [type=text]': function(event, template) {
     Session.set('searchQuery', event.target.value);
     }*/

    "change #radius": function (event) {
        event.preventDefault();
        var option = event.target.value;
        option = option.split(',');
        Session.set('mapRadius', parseInt(option[0]));
        Session.set('mapZoom', parseInt(option[1]));
    }
});
Template.navbar.helpers({
    searchQuery: function () {
        return Session.get('searchQuery');
    }
});

/*
 Tracker.autorun(function() {
 if (Session.get('searchQuery')) {
 Meteor.subscribe('tagSearch', Session.get('searchQuery'));
 }
 });*/

$(document).ready(function () {
    // delegate calls to data-toggle="lightbox"
    $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
        event.preventDefault();
        return $(this).ekkoLightbox();
    });
});