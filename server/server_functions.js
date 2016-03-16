/**
 * Created by Daniel on 11.03.2016.
 */
Meteor.startup(function () {
    Tags._ensureIndex({latLng: "2dsphere"});
});