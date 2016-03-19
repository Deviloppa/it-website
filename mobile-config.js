// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
  id: 'de.it.meteor',
  name: 'Meteor IT',
  description: 'Get über power in one button click',
  author: 'IT Development Group',
  email: 'contact@example.com',
  website: 'http://example.com'
});

// Set up resources such as icons and launch screens.
/*App.icons({
  'iphone': 'icons/icon-60.png',
  'iphone_2x': 'icons/icon-60@2x.png',
  // ... more screen sizes and platforms ...
});*/

/*App.launchScreens({
  'iphone': 'splash/Default~iphone.png',
  'iphone_2x': 'splash/Default@2x~iphone.png',
  // ... more screen sizes and platforms ...
});*/

// Set PhoneGap/Cordova preferences
App.setPreference('BackgroundColor', '0xff0000ff');
App.setPreference('HideKeyboardFormAccessoryBar', true);

App.accessRule("blob:*");
App.accessRule("http://ts.styre.de:2425/*");
