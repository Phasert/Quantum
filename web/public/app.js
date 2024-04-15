document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const popupContainer = document.getElementById('popupContainer');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const signUpForm = document.querySelector('.sign-up-container form'); 
    const loginLink = document.getElementById('loginLink');
    const closeButton = document.getElementById('closeButton');
    function openPopup() {
        container.classList.add("right-panel-active");
        popupContainer.style.display = 'flex';
    }

    function closePopup() {
        container.classList.remove("right-panel-active");
        popupContainer.style.display = 'none';
    }

    closeButton.addEventListener('click', function() {
        closePopup();
    });

    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });

    loginLink.addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/get-user-data')
        .then(response => {
            if(response.ok) {
                window.location.href = "/userDashboard.html";
            } else {
                openPopup();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            openPopup();
        });
    });

    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Check if passwords match
        if (password !== confirmPassword) {
            alert('The passwords do not match. Please try again.');
            return; // Stop the form submission
        }
    
        fetch('/signup', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Data received:', data);
            if (data.customerId) {
                alert(`Signup successful. Your customer ID is ${data.customerId}`);
                closePopup();
            } else {
                // This else block might be redundant if you're always expecting a customerId on success
                alert('Signup failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during signup.');
        });
    });
    
    
    

    // Check if user is already logged in
    fetch('/get-user-data')
    .then(response => response.json())
    .then(data => {
        if (data.firstName) {
            loginLink.outerHTML = '<a href="userDashboard.html" id="dashboardLink"><i class="fas fa-user" style="color: #ffffff;"></i></a>';
        }
    })
    .catch(error => {
        console.log('Error checking login status:', error);
    });
// image functions
function selectOption(index) {
    var smallImages = document.querySelectorAll('.small-image');
    var selectedImage = document.getElementById('selectedImage');
    var selectedOptionName = document.getElementById('selectedOptionName');
    var productDescription = document.getElementById('productDescription');
    var optionSelector = document.getElementById('options');

    // Change the source of the big image
    selectedImage.src = smallImages[index].src;

    // Display the name of the selected option
    selectedOptionName.innerText = optionSelector.options[index].text;

    // Highlight the selected small image
    smallImages.forEach(function (image, i) {
        image.style.opacity = i === index ? 1 : 0.7;
    });

    // Change the product description based on the selected option
    switch (index) {
        case 0:
            productDescription.innerText = "These glasses has a broad bowl with a tapered top, allowing ample aeration for the wine to breathe.";
            break;
        case 1:
            productDescription.innerText = "These glasses has an elongated shape, that helps preserve the bubbles and enhances the effervescence of the champagne.";
            break;
        case 2:
            productDescription.innerText = "These glasses has a wide and shallow bowl with a stem, allowing for easy swirling and appreciating the drink's aromas.";
            break;
        case 3:
            productDescription.innerText = "These glasses has an inverted cone shape with a wide and shallow bowl with a stem.";
            break;
        // Add more cases as needed
    }
}

function closeForm() {
    document.getElementById("myForm").style.display = "none";
}
function updateCostEstimate() {
var quantitySelector = document.getElementById('quantity');
var costEstimateSpan = document.getElementById('costEstimate');
var selectedOption = document.getElementById('options').value;

var selectedQuantity = parseInt(quantitySelector.value);
var optionCosts = {
    'Red Wine Glass': 120,  // Red Wine Glass cost per dozen
    'Champagne Glass': 60,    // Champagne Glass cost per dozen
    'Cocktail Glass': 72,  // Cocktail Glass cost per dozen
    'Martini Glass': 96,    // Martini Glass cost per dozen
};
var costPerDozen = optionCosts[selectedOption] || 0;  // Default to 0 if option is not found
var estimatedCost = (selectedQuantity / 12) * costPerDozen;

costEstimateSpan.textContent = '$' + estimatedCost.toFixed(2);
}

// add to cart
function addToCart() {
    var selectedOption = document.getElementById('options').value;
    var selectedQuantity = parseInt(document.getElementById('quantity').value);
    var rentDate = document.getElementById('rentDate').value;
    var rentTime = document.getElementById('rentTime').value;
    var returnDate = document.getElementById('returnDate').value;
    var returnTime = document.getElementById('returnTime').value;
    var comment = document.getElementById('comment').value;

    var optionCosts = {
        'Red Wine Glass': 120,
        'Champagne Glass': 60,
        'Cocktail Glass': 72,
        'Martini Glass': 96,
    };

    var costPerDozen = optionCosts[selectedOption] || 0;
    var estimatedCost = (selectedQuantity / 12) * costPerDozen;

    // Create a new cart item
    var newItem = {
        option: selectedOption,
        quantity: selectedQuantity,
        costEstimate: estimatedCost,
        comment: comment,
        rentDate: rentDate,
        rentTime: rentTime,
        returnDate: returnDate,
        returnTime: returnTime
    };

    // Add the new item to the cart
    cart.push(newItem);

    // Display added to cart message
    var addedToCartMessage = document.getElementById('addedToCartMessage');
    addedToCartMessage.style.display = 'block';

    // Hide the message after 2 seconds (adjust as needed)
    setTimeout(function () {
        addedToCartMessage.style.display = 'none';
    }, 2000);

    // Save the updated cart to sessionStorage
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Send cart data to the server
    fetch('/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Item added to the cart:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    
}



});
