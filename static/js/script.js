document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-btn');
    const predictBtn = document.getElementById('predict-btn');
    const btnText = predictBtn.querySelector('.btn-text');
    const btnIcon = predictBtn.querySelector('.btn-icon');
    const spinner = predictBtn.querySelector('.spinner');
    
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    let currentFile = null;

    // --- Drag and Drop Handlers ---
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Click to open file dialog
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }

    // --- File Processing ---

    function handleFile(file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showError("Please upload a valid image file (JPG, JPEG, PNG).");
            return;
        }

        currentFile = file;
        hideError();

        // Show preview
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            imagePreview.src = reader.result;
            dropZone.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        }
    }

    // --- Button Actions ---

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = ''; // Clear input
        previewContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    // --- Prediction API Call ---

    predictBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // Set loading state
        setLoadingState(true);
        hideError();

        // Prepare form data
        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong during prediction.');
            }

            // Display Result
            showResult(data);

        } catch (error) {
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    });

    // --- UI Helpers ---

    function setLoadingState(isLoading) {
        if (isLoading) {
            predictBtn.disabled = true;
            btnText.textContent = 'Analyzing...';
            btnIcon.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            predictBtn.disabled = false;
            btnText.textContent = 'Predict Tumor';
            btnIcon.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    function showResult(data) {
        sessionStorage.setItem('tumorData', JSON.stringify(data));
        window.location.href = '/result';
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
    }
});
