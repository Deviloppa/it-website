/**
 * Created by Daniel on 11.03.2016.
 */


Meteor.publish('tagSearch', function(query) {

    check(query, String); // Typprüfung

    if(_.isEmpty(query)) {
        return this.ready();
    }

    return Tags.search(query);
});