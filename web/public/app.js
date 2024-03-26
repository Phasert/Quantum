document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const popupContainer = document.getElementById('popupContainer');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const signUpForm = document.querySelector('.sign-up-container form'); 
    
    // Open the popup when the page loads
    function openPopup() {
        container.classList.add("right-panel-active");
        popupContainer.style.display = 'flex';
    }
    openPopup();

    // Close the popup
    function closePopup() {
        container.classList.remove("right-panel-active");
        popupContainer.style.display = 'none';
    }

    // Close the popup if the user clicks outside the form
    popupContainer.addEventListener('click', (event) => {
        if (event.target === popupContainer) {
            closePopup();
        }
    });

    // Toggle between sign in and sign up
    signUpButton.addEventListener('click', () => {
        container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove("right-panel-active");
    });

    // Validate password and confirm password on form submit
    signUpForm.addEventListener('submit', function(event) {
        const password = document.getElementById('password').value; // Ensure your password input has id="password"
        const confirmPassword = document.getElementById('confirmPassword').value; // Ensure your confirm password input has id="confirmPassword"

        if (password !== confirmPassword) {
            event.preventDefault(); // Prevent form from submitting
            alert('Passwords do not match. Please try again.');
        }
    });
});
