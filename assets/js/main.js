// Mengen sinnvoll runden, je nach Einheit (Klasse "unit<einheit>" an der Zelle)
const roundAmount = (value, unit) => {
    const step = (s) => Math.max(s, Math.round(value / s) * s);
    switch (unit) {
        case 'g':
        case 'ml':
            return value < 20 ? step(1) : step(5);
        case 'l':
            return step(0.1);
        case 'tsp':
        case 'tbsp':
            return step(0.25);
        default: // Stück, Prise, ohne Einheit
            return step(0.5);
    }
};

const amountFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

function recalculateAmounts() {
    const servings = parseFloat(document.getElementById('servings').value),
        originalCount = parseFloat(document.getElementById('ingredientsTable').dataset.originalservings);

    document.querySelectorAll('.amount').forEach(amount => {
        const originalAmount = parseFloat(amount.getAttribute('data-original'));
        if (isNaN(originalAmount) || isNaN(servings) || !originalCount) {
            return;
        }
        const unitClass = Array.from(amount.classList).find(c => c.startsWith('unit')) || '';
        const value = servings === originalCount
            ? originalAmount
            : roundAmount(originalAmount / originalCount * servings, unitClass.slice(4));
        amount.textContent = amountFormat.format(value);
    });
}

const toggleFavourite = (pointer) => {
    setFavourite(pointer, !isFavorite(pointer));
}
const isFavorite = (pointer) => {
    let rid = $(pointer).attr('data-rid');
    if(!rid) {
        console.warn("No RID found on element", pointer);
    }
    return localStorage.getItem(rid) === 'true';
}
const setFavourite = (pointer, status) => {
    let rid = $(pointer).attr('data-rid');
    if(!rid) {
        console.warn("No RID found on element", pointer);
    }
    localStorage.setItem(rid, status);
    showFavourite(pointer);
}
const showFavourite = (pointer) => {
    if(isFavorite(pointer)) {
        $(pointer).text("❤️").attr('aria-pressed', 'true');
        return;
    }
    $(pointer).text("🖤").attr('aria-pressed', 'false');
}

$(document).ready(function() {
    // Change servings => recalculate amounts
    $('#servings').change(recalculateAmounts);
    if (document.getElementById('servings')) {
        recalculateAmounts();
    }

    // Fetch recipeName
    let recipeName = $('#servings').attr('recipeName');

    // Enable all inputs as fallback
    $('input').prop('disabled', false);

    // Add class pointer to all ol>li elements
    $('ol>li').addClass('pointer');

    // On load, apply red or black hearts.
    $('.btnFavourite').each(function() {
        showFavourite(this);
    });

    // callback for click event on any btn class that contains '🖤' in innerhtml.
    $('body').on('click', '.btnFavourite', function(event) {
        event.preventDefault();
        toggleFavourite(this);
    });


    // Load checkbox state from local storage
    $('input[type="checkbox"]').each(function() {
        let parentLi = $(this).closest('li'), id = recipeName + parentLi.index(), checked = localStorage.getItem(id);

        if(checked === 'true') {
            parentLi.addClass('checked');
        } else {
            parentLi.removeClass('checked');
        }
        $(this).prop('checked', checked === 'true');
    });

    // if an li is clicked, toggle checkbox
    $('li').click(function() {
        let checkbox = $(this).find('input[type="checkbox"]'), checked = checkbox.prop('checked');

        checkbox.prop('checked', !checked).change();
    });
    // Prevent default behaviour when clicking on checkbox
    $('input[type="checkbox"]').click(function(e) {
        e.stopPropagation();
    });

    // if checkboxes are changed, store to local storage
    $('input[type="checkbox"]').change(function() {
        let parentLi = $(this).closest('li'), id = recipeName + parentLi.index(), checked = $(this).prop('checked');

        // if checked, add class 'checked' to previous li
        if(checked) {
            parentLi.prevAll('li').find('input[type="checkbox"]').prop('checked', true).addClass('checked').change();
            parentLi.addClass('checked');
        } else {
            parentLi.nextAll('li').find('input[type="checkbox"]').prop('checked', false).removeClass('checked').change();
            parentLi.removeClass('checked');
        }
        localStorage.setItem(id, checked);
    });


    // add badge classes
    $('a[href^="#"]').addClass('badge bg-light-gray');

    // Jump DOWN to ingredient in recipe when clicking on ingredient in ingredients list
    $('td.ingredientLink').click(function() {
        let ing = $(this).data('ing');
        if(!ing) {
            return;
        }

        // On all other elements, remove bg-light-green class
        $('a[href*="#"]').removeClass('bg-light-green');

        let elm = $('a[href$="#' + ing + '"]');

        $('html, body').animate({
            scrollTop: elm.parent('li').offset().top
        }, 800);

        elm.addClass('bg-light-green');
    });

});

