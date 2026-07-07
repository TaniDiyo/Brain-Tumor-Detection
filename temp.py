import numpy as np
import pandas as pd
import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Your local dataset path

data_path = r"C:\Users\Tanisha\Downloads\BTD\BTD\Brain-Tumor-Classification-DataSet-master"

# List all files in your dataset
for dirname, _, filenames in os.walk(data_path):
    for filename in filenames:
        print(os.path.join(dirname, filename))

        from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, Flatten, Dense, MaxPooling2D, Dropout
from sklearn.metrics import accuracy_score
                                                                       
import io
from PIL import Image
import tqdm
from sklearn.model_selection import train_test_split
import cv2
from sklearn.utils import shuffle
import tensorflow as tf

import os
import cv2
import numpy as np

X_train = []
Y_train = []

image_size = 150

labels = ['glioma_tumor','meningioma_tumor','no_tumor','pituitary_tumor']

data_path = r"C:\Users\Tanisha\Downloads\BTD\BTD\Brain-Tumor-Classification-DataSet-master"

#  Training data
for label in labels:
    folderPath = os.path.join(data_path, 'Training', label)
    
    for file in os.listdir(folderPath):
        img_path = os.path.join(folderPath, file)
        
        img = cv2.imread(img_path)
        
        if img is not None:   
            img = cv2.resize(img, (image_size, image_size))
            X_train.append(img)
            Y_train.append(label)

#  Testing data
for label in labels:
    folderPath = os.path.join(data_path, 'Testing', label)
    
    for file in os.listdir(folderPath):
        img_path = os.path.join(folderPath, file)
        
        img = cv2.imread(img_path)
        
        if img is not None:
            img = cv2.resize(img, (image_size, image_size))
            X_train.append(img)
            Y_train.append(label)

# ==============================
#  Convert to numpy arrays
# ==============================
X = np.array(X_train)
Y = np.array(Y_train)

# ==============================
#  Shuffle data
# ==============================
from sklearn.utils import shuffle
X, Y = shuffle(X, Y, random_state=101)

print("Shape:", X.shape)

# ==============================
#  Label Encoding
# ==============================
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.utils import to_categorical

le = LabelEncoder()
Y = le.fit_transform(Y)
Y = to_categorical(Y)

# ==============================
#  Train Test Split
# ==============================
from sklearn.model_selection import train_test_split

X_train, X_test, Y_train, Y_test = train_test_split(
    X, Y, test_size=0.1, random_state=101
)

model = Sequential()

#  Block 1
model.add(Conv2D(32, (3,3), activation='relu', input_shape=(150,150,3)))
model.add(MaxPooling2D(2,2))

#  Block 2
model.add(Conv2D(64, (3,3), activation='relu'))
model.add(MaxPooling2D(2,2))
model.add(Dropout(0.3))

#  Block 3
model.add(Conv2D(128, (3,3), activation='relu'))
model.add(MaxPooling2D(2,2))
model.add(Dropout(0.3))

#  Block 4
model.add(Conv2D(256, (3,3), activation='relu'))
model.add(MaxPooling2D(2,2))
model.add(Dropout(0.3))

#  Fully Connected
model.add(Flatten())

model.add(Dense(512, activation='relu'))
model.add(Dropout(0.3))

model.add(Dense(4, activation='softmax'))  # 4 classes
model.summary()

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history = model.fit(
    X_train, Y_train,
    epochs=20,
    validation_data=(X_test, Y_test)
)

import matplotlib.pyplot as plt
import seaborn as sns

import matplotlib.pyplot as plt

# model.save('braintumor.h5')

acc = history.history['accuracy']
val_acc = history.history['val_accuracy']

epochs = range(len(acc))

fig = plt.figure(figsize=(14,7))

plt.plot(epochs, acc, 'r', label="Training Accuracy")
plt.plot(epochs, val_acc, 'b', label="Validation Accuracy")

plt.legend(loc='upper left')
plt.xlabel("Epochs")
plt.ylabel("Accuracy")
plt.title("Training vs Validation Accuracy")

plt.show()
import matplotlib.pyplot as plt

loss = history.history['loss']
val_loss = history.history['val_loss']

epochs = range(len(loss))

plt.figure(figsize=(14,7))

plt.plot(epochs, loss, 'r', label="Training Loss")
plt.plot(epochs, val_loss, 'b', label="Validation Loss")

plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.title("Training vs Validation Loss")

plt.legend(loc='upper right')
plt.grid(True)

plt.show()
import cv2
import numpy as np

#  Correct local path
img_path = r"C:\Users\Tanisha\Downloads\BTD\BTD\Brain-Tumor-Classification-DataSet-master\Training\pituitary_tumor\p (107).jpg"

# Read image
img = cv2.imread(img_path)

# Check if loaded
if img is None:
    print("Image not loaded. Check path.")
else:
    # Resize
    img = cv2.resize(img, (150,150))
    
    # Normalize
    img = img / 255.0
    
    # Reshape for CNN
    img_array = np.reshape(img, (1,150,150,3))
    
    print("Shape:", img_array.shape)

    from tensorflow.keras.preprocessing import image
    
import matplotlib.pyplot as plt

#  Use your local path
img_path = r"C:\Users\Tanisha\Downloads\BTD\BTD\Brain-Tumor-Classification-DataSet-master\Training\pituitary_tumor\p (107).jpg"

# Load image
img = image.load_img(img_path)

# Display image
plt.imshow(img)
plt.axis('off')   # hides axis (clean output)
plt.title("Sample MRI Image")

plt.show()

a=model.predict(img_array)
indices = a.argmax()
print(indices)

model.save('braintumor.h5')