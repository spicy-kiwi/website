function recalculateAmounts() {
    let servings = parseFloat(document.getElementById('servings').value);

    let amounts = document.querySelectorAll('.amount');

    let originalCount = parseInt(document.getElementById('ingredientsTable').dataset.originalservings);

    amounts.forEach(amount => {
        const originalAmount = parseFloat(amount.getAttribute('data-original'));

        if(!isNaN(originalAmount)) {
            amount.textContent = originalAmount / originalCount * servings;
        }
    });
}