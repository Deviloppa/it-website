/**
 * Created by Daniel on 13.03.2016.
 */


RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};