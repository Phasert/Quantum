document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const popupContainer = document.getElementById('popupContainer');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const signUpForm = document.querySelector('.sign-up-container form'); 
    const loginLink = document.getElementById('loginLink');
    const closeButton = document.getElementById('closeButton');

    loginLink.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent the default action
        openPopup(); // Call the function to open the popup
        container.classList.remove("right-panel-active"); // Ensure the sign-in form is shown
    });

    function openPopup() {
        container.classList.add("right-panel-active");
        popupContainer.style.display = 'flex';
    }
    openPopup();

    function closePopup() {
        container.classList.remove("right-panel-active");
        popupContainer.style.display = 'none';
    }

    popupContainer.addEventListener('click', (event) => {
        if (event.target === popupContainer) {
            closePopup();
        }
    });
    closeButton.addEventListener('click', function() {
        closePopup(); // Call the function to close the popup
    });
    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });

    // Modified to handle asynchronous form submission
    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form from submitting the traditional way

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return; // Stop here if passwords do not match
        }

        // Use FormData to capture form data
        const formData = new FormData(this);

        fetch('/signup', {
            method: 'POST',
            body: new URLSearchParams(formData) // Convert FormData into URLSearchParams
        })
        .then(response => response.json()) // Parse the JSON response from the server
        .then(data => {
            if(data.customerId) {
                alert(`Signup successful. Your customer ID is ${data.customerId}`);
                closePopup(); // Optionally close the popup on success
            } else {
                alert('Signup failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during signup.');
        });
    });
});
