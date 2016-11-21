var nbsp = String.fromCharCode(160);

module.exports = {
    newline: /(?:\r\n|\r|\n)/g,
    nbspChar: nbsp,

    normalizeWhitespace: function(text) {
        return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp})`, 'g'), ' ');
    }
};
