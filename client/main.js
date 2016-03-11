Meteor.startup(function() {
    GoogleMaps.load();
});

Template.registerHelper('Session', function(param) {
    return Session.get(param);
});
Template.registerHelper('formatDate', function(date) {
    return moment(date).format('DD.MM.YY');
});

// Konstanten
var MAP_ZOOM = 15; // Zoom von der Mapsanzeige
var TEST_COUNTER = 5; // Counter f�r Testzwecke, um verschiedene GPS Werte zu bekommen

Template.map.helpers({
    geoLocationMapOptions: function() {

        // Geolocation
        var latLng = Geolocation.latLng();

        // Make sure the maps API has loaded
        if (GoogleMaps.loaded() && latLng) {
            // Map initialization options
            console.log(latLng);
            return {
                center: new google.maps.LatLng(latLng.lat, latLng.lng),
                zoom: MAP_ZOOM
            };
        }
    }
});

Template.home.helpers({
    tags: function () {
        // Tags zur�ckgeben
        return Tags.find({});
    }
});

Template.home.onCreated(function() {
    // We can use the `ready` callback to interact with the map API once the map is ready.
    GoogleMaps.ready('exampleMap', function(map) {
        // Add a marker to the map once it's ready
        var marker = new google.maps.Marker({
            position: map.options.center,
            map: map.instance
        });
    });
});

Template.home.events({
    "click .previewMap": function (event) {
        // Prevent default browser form submit
        event.preventDefault();
        console.log("clicked");
        var tag_id = $(event.currentTarget).data('id');
        var tag = Tags.findOne(tag_id);

        Session.set('currentTag', tag);
        // TODO: Kartenvorschau
    }
});

Template.tag.events({
    // sobald enter gedr�ckt wird
    "submit .new-tags": function (event) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        var text = event.target.text.value;
        var latLng = Geolocation.latLng();

        // Insert a task into the collection
        Tags.insert({
            text: text,
            createdAt: new Date(),            // current time
            owner: Meteor.userId(),           // _id of logged in user
            username: Meteor.user().username,  // username of logged in user
            position1: latLng.lat + TEST_COUNTER,
            position2: latLng.lng + TEST_COUNTER
        });

        TEST_COUNTER++; // Counter erh�hen, um verschidene GPS Werte zu bekommen

        // Clear form
        event.target.text.value = "";
    }
});

Template.addTag_Modal.events({
    "submit #addTag_Modal_Form": function(event) {
        event.preventDefault();

        console.log("add tag submit event");

        var text = event.target.text.value;
        var latLng = Geolocation.latLng();

        // Insert a task into the collection
        Tags.insert({
            text: text,
            createdAt: new Date(),            // current time
            owner: Meteor.userId(),           // _id of logged in user
            username: Meteor.user().username,  // username of logged in user
            position1: latLng.lat + TEST_COUNTER,
            position2: latLng.lng + TEST_COUNTER
        });

        TEST_COUNTER++; // Counter erh�hen, um verschidene GPS Werte zu bekommen

        // Clear form
        event.target.text.value = "";

        $('#addTag_Modal').modal('hide');
    }
});

Template.tag.events({
    "click .delete": function () {
        Tags.remove(this._id);
    }
});

Template.tag.helpers({
    isOwner: function () {
        return this.owner === Meteor.userId();
    }
});


Template.login_Modal.events({
    "submit #login_Modal_form": function(event) {
        event.preventDefault();

        var username = event.target.login_username.value;
        var password = event.target.login_password.value;

        Meteor.loginWithPassword(username, password, function(err) {
            event.target.login_password.value = "";
            if(err) {
                console.log(err);
                Session.set('loginError', err);
            } else {
                console.log("Successfully logged in");
                Session.set('loginError', null);
                event.target.login_username.value = "";
                $('#login_Modal').modal('hide');
            }
        });

    }
});

Template.login_Modal.helpers({
    "wrongPwd": function() {
        return (_.has(this, 'reason') && this.reason == "Incorrect password");
    },
    "wrongUser": function() {
        return (_.has(this, 'reason') && this.reason == 'User not found');
    }
});


Template.register_Modal.events({
    "submit #register_Modal_form": function(event) {
        event.preventDefault();

        var username = event.target.reg_username.value;
        var password = event.target.password.value;
        var password2 = event.target.password2.value;

        if(password != password2){
            var err = {
                'reason': "pw1_not_pw2"
            };
            Session.set('regError', err);
            return;
        }

        Accounts.createUser({
            "username": username,
            "password": password
        },function(err) {
            event.target.password.value = "";
            event.target.password2.value = "";
            if(err) {
                console.log(err);
                Session.set('regError', err);
            } else {
                console.log("Successfully registriert");
                Session.set('regError', null);
                event.target.reg_username.value = "";
                $('#register_Modal').modal('hide');
            }
        });

    }
});

Template.register_Modal.helpers({
    "pws_dont_match": function() {
        return (_.has(this, 'reason') && this.reason == "pw1_not_pw2");
    },
    "user_already_exits": function() {
        return (_.has(this, 'reason') && this.reason == "Username already exists.");
    }
});

Template.navbar.events({
    "click #logout": function(event){
        event.preventDefault();
        Meteor.logout();
    }
});