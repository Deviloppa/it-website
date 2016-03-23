// Konstanten
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

//Kürzt die Beschreibung in der Tabelle auf 40 Zeichen
Template.registerHelper('formatDesc', function (description) {
    var n = 40;
    var isTooLong = description.length > n;
    var s_ = isTooLong ? description.substr(0, n - 1) : description;    //Trinitätsoperator
    s_ = (isTooLong) ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
    return isTooLong ? s_ + '...' : s_;
});

Template.registerHelper('formatGpsAddTag', function (latLng) {
    if (!_.isUndefined(latLng) && !_.isNull(latLng) && _.has(latLng, 'lat') && _.has(latLng, 'lng')) {
        return latLng.lat + ", " + latLng.lng;
    }
    return "-";
});

Template.registerHelper('formatGpsPreview', function (coordinates) {
    return coordinates[1] + ", " + coordinates[0];
});

Template.map.helpers({
    geoLocationMapOptions: function () {
        var latLng = Geolocation.latLng();
        // Sicherstellen dass die Map geladen ist
        if (GoogleMaps.loaded() && latLng) {
            // Map Optionen
            return {
                center: new google.maps.LatLng(latLng.lat, latLng.lng),
                zoom: 17
            };
        }
    }
});

Template.navbar.helpers({
    searchQuery: function () {
        return Session.get('searchQuery');
    }
});

Template.body.helpers({
    isOwner: function () {
        return this.owner === Meteor.userId();
    }
});


Tracker.autorun(function() {
    var lngLat = Geolocation.latLng();
    var lng = null, lat = null;
    if (!_.isUndefined(lngLat) && !_.isNull(lngLat)) {
        if (_.has(lngLat, 'lat')) lat = lngLat.lat;
        if (_.has(lngLat, 'lng')) lng = lngLat.lng;
    }

    Meteor.subscribe("tags",
        Session.get('searchQuery'),
        lng, lat,
        Session.get('mapRadius')
    );
});

Tracker.autorun(function() {
    var tag = Session.get('currentTag')
    if (!_.isUndefined(tag) && !_.isNull(tag)) {
        Meteor.subscribe('photo',tag .image);
    }
});


Template.registerHelper('tags', function () {
    return Tags.find({});
});

// Googlemapsanezige sowie den Marker und die Kreise um den Marker
Template.body.onCreated(function () {
    GoogleMaps.ready('map', function (map) {
        // Add a marker to the map once it's ready
        var marker = new google.maps.Marker({
            position: map.options.center,
            map: map.instance
        });


        Tracker.autorun(function () {
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

        //Überwacht die Tags ob sich etwas geändert hat und setzt / enfernt dann die Marker auf der Map
        Tags.find({}).observe({
            added: function (document) {
                mapMarkers[document._id] = null;
                window.setTimeout(function () {
                    var tagMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(document.latLng.coordinates[1], document.latLng.coordinates[0]),
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
                mapMarkers[newDocument._id].setPosition({
                    lng: newDocument.latLng.coordinates[1],
                    lat: newDocument.latLng.coordinates[0]
                });
            },
            removed: function (oldDocument) {
                mapMarkers[oldDocument._id].setMap(null);

                google.maps.event.clearInstanceListeners(
                    mapMarkers[oldDocument._id]
                );

                // Entfernt den Marker
                delete mapMarkers[oldDocument._id];
            }
        });

    });
});


Template.body.events({
    //Ermöglicht es die Tags in der Googlemapskarte anzuklicken
    "click .previewMap": function (event) {
        event.preventDefault();
        var tag_id = $(event.currentTarget).data('id');
        var tag = Tags.findOne(tag_id);

        Session.set('currentTag', tag);
    },
    //Löschen eines Tags
    "click .delete": function () {
        Meteor.call("deleteTag", this._id, function(error, result) {
            if (error) {
                alert(error);
            }
        });
    }
});

// Tag eintragen ( Überprüft ob eine Datei oder ein Foto angeben wurde und ruft dann den entsprechenden Call auf
Template.addTag_Modal.events({
    "submit #addTag_Modal_Form": function (event) {
        event.preventDefault();

        var titel = event.target.titel.value;
        var desc = event.target.description.value;
        var _latLng = Geolocation.latLng();
        var coords = event.target.koordinaten.value.trim();
        var files = event.target.file.files;

        if (files.length > 0) {
            for (var i = 0, ln = files.length; i < ln; i++) {
                var fsFile = new FS.File(files[i]);
                fsFile.owner = Meteor.userId();
                Images.insert(fsFile, function(err, fileObj) {
                    if (err) {
                        console.log(err);
                    }
                    Meteor.call("addTag", titel, desc, _latLng, fileObj, coords);
                });
            }
        } else {
            var photo = Session.get('photo');
            if(_.isUndefined(photo) || _.isNull(photo)) {
                Meteor.call("addTag", titel, desc, _latLng, null, coords);
            } else {
                Meteor.call("addTag", titel, desc, _latLng, photo, coords);
            }
        }

        //Form wieder leeren
        event.target.titel.value = "";
        event.target.description.value = "";
        event.target.koordinaten.value = "";
        event.target.file.value = "";
        Session.set('photo', null);

        $('#addTag_Modal').modal('hide');
    },

     "click #takePhoto": function() {
         MeteorCamera.getPicture({width: 1280, height: 1024, quality: 49}, function(error, data){
            if(error){
                alert(error);
            }
            Session.set('photo', data);
         });
     }
});

Template.addTag_Modal.helpers({
    'gpsCords': function () {
        return Geolocation.latLng();
    },
    'datum': function () {
        return new Date();
    }
});

Template.navbar.events({
    //Logout
    "click #logout": function (event) {
        event.preventDefault();
        Meteor.logout();
    },

    // Sucheingabe in der Navbar
    'keyup [type=text]': function (event, template) {
        event.preventDefault();
        Session.set('searchQuery', event.target.value);
    },

    //Ändern des Radius in der Navbar
    "change #radius": function (event) {
        event.preventDefault();
        var option = event.target.value;
        option = option.split(',');
        Session.set('mapRadius', parseInt(option[0]));
        Session.set('mapZoom', parseInt(option[1]));
    }
});

$(document).ready(function () {
    // Leitet die Aufrufe zu data-toggle="lightbox"
    $(document).delegate('*[data-toggle="lightbox"]', 'click', function (event) {
        event.preventDefault();
        return $(this).ekkoLightbox();
    });
});