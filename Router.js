// Header und Footer f�r alle Seiten
Router.configure({
    layoutTemplate: 'main'
});

// Route f�r Hauptseite
Router.route('/', {
    name: 'home',
    template: 'home'
});

// Routen f�r weitere Seiten
Router.route('/register');
Router.route('/login');
Router.route('/newTag');
