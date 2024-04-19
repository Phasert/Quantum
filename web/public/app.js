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
    function isValidPhoneNumber(phoneNumber) {
        // Regular expression to match the phone number format "XXX-XXX-XXXX" or "XXX-XXXXXXX"
        const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
        return phoneRegex.test(phoneNumber);
    }
    

    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const phoneNumber = formData.get('phone');
        
        // Check if passwords match
        if (password !== confirmPassword) {
            alert('The passwords do not match. Please try again.');
            return; // Stop the form submission
        }
    
        // Check if phone number format is valid
        if (!isValidPhoneNumber(phoneNumber)) {
            alert('Please enter a phone number in the format XXX-XXX-XXXX.');
            return; // Stop the form submission
        }
    
        // If everything is valid, proceed with form submission
        fetch('/signup', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Data received:', data);
            if (data.customerId) {
                alert(`Signup successful. Check your email for your login ID`);
                closePopup();
            } else {
                // This else block might be redundant if you're always expecting a customerId on success
                alert('Signup failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('The email is already linked to an account. Please use another.');
        });
    });
    
    
    

    // Check if user is already logged in
    fetch('/get-user-data')
    .then(response => response.json())
    .then(data => {
        if (data.firstName) {
            loginLink.outerHTML = '<a href="userDashboard.html" id="dashboardLink"><i class="fas fa-user" ></i></a>';
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


  


});
function addToCart() {
    var selectedOption = document.getElementById('options').value;
    var selectedQuantity = parseInt(document.getElementById('quantity').value);
    var rentDate = document.getElementById('rentDate').value;
    var rentTime = document.getElementById('rentTime').value;
    var returnDate = document.getElementById('returnDate').value;
    var returnTime = document.getElementById('returnTime').value;
    var comment = document.getElementById('comment').value;


    var data = {
        options: selectedOption,
        quantity: selectedQuantity,
        comment: comment,
        rentDate: rentDate,
        rentTime: rentTime,
        returnDate: returnDate,
        returnTime: returnTime
    };

    // Make an AJAX request to add the item to the cart
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/cart');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            // Item added successfully, display the message
            var addedToCartMessage = document.getElementById('addedToCartMessage');
            addedToCartMessage.style.display = 'block';

            // Hide the message after 2 seconds (adjust as needed)
            setTimeout(function () {
                addedToCartMessage.style.display = 'none';
            }, 2000);

            // Item added successfully, do something if needed
            console.log('Item added to cart');
        } else {
            // Error handling
            console.error('Error adding item to cart:', xhr.statusText);
        }
    };
    xhr.onerror = function () {
        console.error('Request failed');
    };
    xhr.send(JSON.stringify(data));
}