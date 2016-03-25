/*
Loggt den Benutzer auf der Seite ein, falls es keinen Fehler beim Login gab
 */
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

/*
 Setzt Fehler sodass der Benutzer sehen was schief gelaufen ist
 */
Template.login_Modal.helpers({
    "wrongPwd": function() {
        return (_.has(this, 'reason') && this.reason == "Incorrect password");
    },
    "wrongUser": function() {
        return (_.has(this, 'reason') && this.reason == 'User not found');
    }
});

/*
Überprüft beim Login ob beide Kennwröter übereinstimmen und wenn ja wird der Benutzer registriert
Ansonsten gibt es eine Fehlermeldung für den Benutzer
 */
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