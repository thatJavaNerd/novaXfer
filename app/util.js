var nbsp = String.fromCharCode(160);

module.exports = {
    /**
     * Replaces all sequences of new line, nbsp, and space characters with a
     * single space.
     */
    normalizeWhitespace: function(text) {
        return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp}| )+`, 'g'), ' ').trim();
    }
};
