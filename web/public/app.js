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

    function handleRedirection(data) {
        if (data.position) {
            // User is staff
            if (data.position.toLowerCase() === 'driver') {
                window.location.href = 'driverDashboard.html';
            } else {
                window.location.href = 'staffDashboard.html';
            }
        } else {
            // User is a customer
            window.location.href = 'userDashboard.html';
        }
    }

    // Fetch user data to determine login status and modify the login link
    fetch('/get-user-data')
        .then(response => response.json())
        .then(data => {
            if (data.firstName) {
                // User is logged in, replace login link with user icon link
                loginLink.outerHTML = '<a href="#" id="dashboardLink"><i class="fas fa-user" style="color: #ffffff;"></i></a>';

                // Add event listener to the new dashboard link
                const dashboardLink = document.getElementById('dashboardLink');
                dashboardLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    handleRedirection(data);
                });
            } else {
                loginLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    fetch('/get-user-data')
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                throw new Error('Not logged in');
                            }
                        })
                        .then(data => {
                            handleRedirection(data);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            openPopup();
                        });
                });
            }
        })
        .catch(error => {
            console.log('User not logged in or error fetching user data:', error);
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                fetch('/get-user-data')
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Not logged in');
                        }
                    })
                    .then(data => {
                        handleRedirection(data);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        openPopup();
                    });
            });
        });

    function isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
        return phoneRegex.test(phoneNumber);
    }

    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const phoneNumber = formData.get('phone');

        if (password !== confirmPassword) {
            alert('The passwords do not match. Please try again.');
            return;
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            alert('Please enter a phone number in the format XXX-XXX-XXXX.');
            return;
        }

        fetch('/signup', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Data received:', data);
            if (data.customerId) {
                alert('Signup successful. Check your email for your login ID');
                closePopup();
            } else {
                alert('Signup failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('The email is already linked to an account. Please use another.');
        });
    });

    function selectOption(index) {
        var smallImages = document.querySelectorAll('.small-image');
        var selectedImage = document.getElementById('selectedImage');
        var selectedOptionName = document.getElementById('selectedOptionName');
        var productDescription = document.getElementById('productDescription');
        var optionSelector = document.getElementById('options');

        selectedImage.src = smallImages[index].src;
        selectedOptionName.innerText = optionSelector.options[index].text;

        smallImages.forEach(function (image, i) {
            image.style.opacity = i === index ? 1 : 0.7;
        });

        switch (index) {
            case 0:
                productDescription.innerText = "These glasses have a broad bowl with a tapered top, allowing ample aeration for the wine to breathe.";
                break;
            case 1:
                productDescription.innerText = "These glasses have an elongated shape that helps preserve the bubbles and enhances the effervescence of the champagne.";
                break;
            case 2:
                productDescription.innerText = "These glasses have a wide and shallow bowl with a stem, allowing for easy swirling and appreciating the drink's aromas.";
                break;
            case 3:
                productDescription.innerText = "These glasses have an inverted cone shape with a wide and shallow bowl with a stem.";
                break;
        }
    }

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

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/cart');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status === 200) {
                var addedToCartMessage = document.getElementById('addedToCartMessage');
                addedToCartMessage.style.display = 'block';

                setTimeout(function () {
                    addedToCartMessage.style.display = 'none';
                }, 2000);

                console.log('Item added to cart');
            } else {
                console.error('Error adding item to cart:', xhr.statusText);
            }
        };
        xhr.onerror = function () {
            console.error('Request failed');
        };
        xhr.send(JSON.stringify(data));
    }
});