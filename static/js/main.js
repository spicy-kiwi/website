function recalculateAmounts() {
    let servings = parseFloat(document.getElementById('servings').value),
        originalCount = parseInt(document.getElementById('ingredientsTable').dataset.originalservings);

    document.querySelectorAll('.amount').forEach(amount => {
        const originalAmount = parseFloat(amount.getAttribute('data-original'));
        if(!isNaN(originalAmount)) {
            amount.textContent = ( originalAmount / originalCount * servings ).toFixed(2);
        }
    });
}

$('document').ready(function() {
    // Change servings => recalculate amounts
    $('#servings').change(recalculateAmounts);

    // Enable all inputs as fallback
    $('input').prop('disabled', false);

    // Add class pointer to all ol>li elements
    $('ol>li').addClass('pointer');

    // Load checkbox state from local storage
    $('input[type="checkbox"]').each(function() {
        let parentLi = $(this).closest('li'),
            id = parentLi.index(),
            checked = localStorage.getItem(id);

        if(checked === 'true') {
            parentLi.addClass('checked');
        } else {
            parentLi.removeClass('checked');
        }
        $(this).prop('checked', checked === 'true');
    });

    // if an li is clicked, toggle checkbox
    $('li').click(function() {
        let checkbox = $(this).find('input[type="checkbox"]'),
            checked = checkbox.prop('checked');

        checkbox.prop('checked', !checked).change();
    });
    // Prevent default behaviour when clicking on checkbox
    $('input[type="checkbox"]').click(function(e) {
        e.stopPropagation();
    });

    // if checkboxes are changed, store to local storage
    $('input[type="checkbox"]').change(function() {
        let parentLi = $(this).closest('li'),
            id = parentLi.index(),
            checked = $(this).prop('checked');

        // if checked, add class 'checked' to previous li
        if(checked) {
            parentLi.prevAll('li').find('input[type="checkbox"]').prop('checked', true).addClass('checked').change();
            parentLi.addClass('checked');
        } else {
            parentLi.nextAll('li').find('input[type="checkbox"]').prop('checked', false).removeClass('checked').change();
            parentLi.removeClass('checked');
        }

        // STOR
        localStorage.setItem(id, checked);
    });


    // add badge classes
    $('a[href^="#"]').addClass('badge badge-light');

    // Jump to ingredient in recipe when clicking on ingredient in ingredients list
    $('td.ingredientLink').click(function() {
        let ing = $(this).data('ing');
        if(!ing) {
            return;
        }

        // On all other elements, remove bg-light-green class
        $('a[href^="#"]').removeClass('bg-light-green');

        let elm = $('a[href$="#' + ing + '"]');

        $('html, body').animate({
            scrollTop: elm.parent('li').offset().top
        }, 800);

        elm.addClass('bg-light-green');
    });

});

