// Header und Footer für alle Seiten
Router.configure({
  layoutTemplate: 'main'
});

// Route für Hauptseite
Router.route('/', {
  name: 'home',
  template: 'home'
});

// Routen für weitere Seiten
Router.route('/register');
Router.route('/login');
Router.route('/newTag');

// Erstellen der Collection für die Tags
Tags = new Mongo.Collection("tags");

// Konstanten
var MAP_ZOOM = 15; // Zoom von der Mapsanzeige
var TEST_COUNTER = 5; // Counter für Testzwecke, um verschiedene GPS Werte zu bekommen

/**
 * CLIENT
 */
if (Meteor.isClient) {
  Meteor.startup(function() {
    GoogleMaps.load();
  });

  Template.home.helpers({
    exampleMapOptions: function() {
      // Geolocation
      var latLng = Geolocation.latLng();

      // Make sure the maps API has loaded
      if (GoogleMaps.loaded() && latLng) {
        // Map initialization options
        return {
          center: new google.maps.LatLng(latLng.lat, latLng.lng),
          zoom: MAP_ZOOM
        };
      }
    },
    tags: function () {
      // Tags zurückgeben
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
      // TODO: Kartenvorschau
    }
  });

  Template.newTag.events({
    // sobald enter gedrückt wird
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

      TEST_COUNTER++; // Counter erhöhen, um verschidene GPS Werte zu bekommen

      // Clear form
      event.target.text.value = "";
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

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

/**
 * SERVER
 */
if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}