import tensorflow as tf
import numpy as np

# Lightweight MobileNetV3-Small based liveness classifier
# Input: 128x128 RGB face crop
# Output: [real, spoof] probability

base = tf.keras.applications.MobileNetV3Small(
    input_shape=(128, 128, 3),
    include_top=False,
    weights=None,
    include_preprocessing=False
)

model = tf.keras.Sequential([
    base,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(2, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')

# Convert to TFLite INT8
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
tflite_model = converter.convert()

with open('liveness.tflite', 'wb') as f:
    f.write(tflite_model)

print(f"Liveness model size: {len(tflite_model)/1024:.1f} KB")
