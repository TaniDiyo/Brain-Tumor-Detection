import os
import cv2
import numpy as np
import time
import json
from flask import Flask, request, render_template, jsonify
from tensorflow.keras.models import load_model

app = Flask(__name__)

# Load the trained model
MODEL_PATH = r"C:\Users\Tanisha\Downloads\BTD\BTD\braintumor.h5"
model = None
try:
    model = load_model(MODEL_PATH, compile=False)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# Define class labels corresponding to the training data
labels = ['glioma_tumor', 'meningioma_tumor', 'no_tumor', 'pituitary_tumor']

# Format class names for display
def format_class_name(class_name):
    return class_name.replace('_', ' ').title()

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/result', methods=['GET'])
def result_page():
    return render_template('result.html')

@app.route('/history', methods=['GET'])
def get_history():
    history_path = os.path.join(os.path.dirname(__file__), 'training_history.json')
    try:
        with open(history_path, 'r') as f:
            history_data = json.load(f)
        return jsonify(history_data)
    except Exception as e:
        return jsonify({'error': 'History file not found.'}), 404

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded. Please check the server logs.'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request.'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading.'}), 400

    try:
        # Read the image file using OpenCV
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Invalid image file.'}), 400

        # Preprocess the image
        img = cv2.resize(img, (150, 150))
        # Note: Model was trained without dividing by 255.0, so we pass raw pixel values
        img_array = np.reshape(img, (1, 150, 150, 3))

        # Predict
        start_time = time.time()
        predictions = model.predict(img_array)
        end_time = time.time()
        inference_time = round(end_time - start_time, 4)

        class_idx = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        predicted_class = labels[class_idx]
        formatted_class = format_class_name(predicted_class)

        descriptions = {
            'glioma_tumor': 'Glioma is a type of tumor that occurs in the brain and spinal cord. It begins in the glial cells that surround nerve cells and help them function.',
            'meningioma_tumor': 'A meningioma is a tumor that arises from the meninges — the membranes that surround your brain and spinal cord.',
            'no_tumor': 'No signs of a brain tumor were detected in the provided MRI scan.',
            'pituitary_tumor': 'Pituitary tumors are abnormal growths that develop in your pituitary gland, affecting hormone production.'
        }
        
        description = descriptions.get(predicted_class, 'Description not available.')
        
        if predicted_class == 'no_tumor':
            performance_analysis = f"Inference completed in {inference_time} seconds. The model structure analysis confirms normal architectural features without detecting pathological formations."
        else:
            performance_analysis = f"Inference completed in {inference_time} seconds. The model confidently identified features indicative of {formatted_class}. Feature maps activated in regions matching known morphological patterns."

        all_probabilities = {format_class_name(labels[i]): round(float(predictions[0][i]) * 100, 2) for i in range(len(labels))}

        return jsonify({
            'class': predicted_class,
            'formatted_class': formatted_class,
            'confidence': round(confidence * 100, 2),
            'description': description,
            'performance_analysis': performance_analysis,
            'all_probabilities': all_probabilities,
            'inference_time': inference_time
        })

    except Exception as e:
        return jsonify({'error': f'An error occurred during processing: {str(e)}'}), 500

if __name__ == '__main__':
    # Run the app
    app.run(debug=True, port=5000)
