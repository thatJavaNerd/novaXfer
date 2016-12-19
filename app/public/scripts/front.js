$(function() {
    $('#find-equivalencies').click(function() {
        var course = $('.input[data-name=course]').first().text().trim();
        var institution = $('.input[data-name=inst]').first().text().trim();

        var url = `/api/course/${course}/${institution}`;
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(response) {
                console.log(response);
                var output = response.equivalencies[0].output[0];
                $('#result').removeAttr('hidden').removeClass('text-warning').addClass('text-success').text(output.subject + ' ' + output.number)
            },
            error: function(xhr, ajaxOptions, thrownError) {
                $('#result').removeAttr('hidden').removeClass('text-success').addClass('text-warning').text('Probably not');
            }
        });
    });
});
